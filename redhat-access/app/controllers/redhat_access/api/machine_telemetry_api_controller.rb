require_dependency "redhat_access/application_controller"
require 'rest_client'
require 'redhat_access_lib'
require 'uri'

module RedhatAccess
  module Api
    class MachineTelemetryApiController < TelemetryApiController

      skip_before_action :authorize
      skip_before_action :require_login
      skip_before_action :session_expiry
      skip_before_action :verify_authenticity_token
      skip_before_action :check_telemetry_enabled
      before_action :telemetry_auth
      before_action :ensure_telemetry_enabled, :only => [:proxy, :proxy_upload]

      def telemetry_auth
        authenticate_client
        unless valid_machine_user?
          deny_access
        end
      end

      def ensure_telemetry_enabled
        render_telemetry_off unless telemetry_enabled_for_uuid?(User.current.login)
      end

      def get_auth_opts(creds)
        if valid_machine_user?
          get_ssl_options_for_uuid(User.current.login, nil)
        else
          raise(RedhatAccess::Telemetry::LookUps::RecordNotFound,'Invalid User')
        end
      end

      def api_connection_test
        client = get_api_client
        res = client.call_tapi('GET', '/', nil, nil, {timeout: get_tapi_timeout})
        Rails.logger.debug(res[:data])
        render status: res[:code], json: {}
      end

      def proxy_upload
        original_method = request.method
        original_params = add_branch_to_params(request.query_parameters)
        original_payload = request.request_parameters[controller_name]
        if not params[:id] and params[:test]
          resource = "uploads/"
          original_payload = {:test => params[:test]}
        else
          resource = "uploads/#{params[:id]}"
        end
        if request.format.json?
          original_payload = original_payload.to_json
        end
        if params[:file]
          #Overwrite payload if sending a file
          original_payload = get_file_data(params)
        end

        client = get_api_client
        Rails.logger.debug("Proxy upload original_payload : #{original_payload}")
        res = client.call_tapi(original_method, URI.escape(resource), original_params, original_payload, {timeout: get_upload_timeout}, use_subsets)
        render status: res[:code], json: res[:data]
      end

      def get_branch_info
        uuid = User.current.login
        begin
          org = get_organization(uuid)
          labels = get_labels_for_host(uuid)
          major, minor, build = get_plugin_parent_version.scan(/\d+/)
          client_id = {:remote_leaf => uuid,
                       :remote_branch => get_branch_id_for_org(org),
                       :display_name => org.name,
                       :hostname => request.host,
                       :product => {:type => get_plugin_parent_name,
                                    :major_version => major,
                                    :minor_version => minor
                       },
                       :organization_id => org.id,
                       :satellite_instance_id => get_foreman_instance_id,
                       :labels => labels
          }
          render :json => client_id.to_json
        rescue RedhatAccess::Telemetry::LookUps::RecordNotFound => e
          http_error_response(e.message, 400)
        end
      end


      protected

      def use_subsets
        false
      end

      def valid_machine_user?
        if User.current && User.current.is_a?(RedhatAccess::Authentication::CertUser)
          return true unless get_content_host(User.current.login).nil?
          return false
        else
          return false
        end
      end

      def get_http_user_agent
        base_user_agent = super
        client_user_agent = request.env['HTTP_USER_AGENT']
        "#{base_user_agent};#{client_user_agent}"
      end


      def get_branch_id
        get_branch_id_for_uuid(User.current.login)
      end

      def get_labels_for_host(uuid)
        host = get_content_host(uuid)
        org = get_organization(host)

        # get organization
        labels = [{
                      :namespace => "Satellite",
                      :key => "Organization",
                      :value => org.name
                  }]

        # get locations - one tag for each location element
        location = host.location
        unless location.nil?
          location.title.split('/').each do |title|
            labels += [{
                           :namespace => "Satellite",
                           :key => "Location",
                           :value => title
                       }]
          end
        end

        # get hostgroup and config groups
        hostgroup = host.hostgroup_id.nil? ? nil : ::Hostgroup.unscoped.find(host.hostgroup_id)
        unless hostgroup.nil?
          hostgroup.title.split('/').each do |title|
            labels += [{
                           :namespace => "Satellite",
                           :key => "Host Group",
                           :value => title
                       }]
          end

          # We're leaving these out for the moment....

          # # seems like this is missing parent config groups...
          # hostgroup.all_config_groups.each do |config_group|
          #   labels += [{
          #                  :namespace => "Satellite",
          #                  :key => "Config Group",
          #                  :value => config_group.name
          #              }]
          # end
        end

        # get host_collections
        host.host_collections.each do |collection|
          labels += [{
                         :namespace => "Satellite",
                         :key => "Host Collection",
                         :value => collection.name
                     }]
        end

        # We're also leaving these out....

        # # get parameters - perhaps we should only include parameter.searchable_value == true?
        # host.host_inherited_params_objects.each do |parameter|
        #   labels += [{
        #                  :namespace => "SatelliteParameter",
        #                  :key => parameter.name,
        #                  :value => parameter.value
        #              }]

        return labels
      end
    end
  end
end
