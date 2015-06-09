require_dependency "redhat_access/application_controller"
require 'rest_client'
require 'redhat_access_lib'

module RedhatAccess
  module Api
    class MachineTelemetryApiController < TelemetryApiController

      skip_before_filter :authorize
      skip_before_filter :require_login
      skip_before_filter :session_expiry
      skip_before_filter :verify_authenticity_token
      skip_before_filter :check_telemetry_enabled
      before_filter :telemetry_auth
      before_filter :ensure_telemetry_enabled, :only => [:proxy, :proxy_upload]

      def telemetry_auth
        authenticate_client
        unless valid_machine_user?
          deny_access
        end
      end

      def ensure_telemetry_enabled
        render_telemetry_off unless telemetry_enabled_for_uuid?(User.current.login)
      end

      def get_auth_opts()
        if valid_machine_user?
          get_ssl_options_for_uuid(User.current.login, nil)
        else
          raise(RedhatAccess::Telemetry::LookUps::RecordNotFound,'Invalid User')
        end
      end

      def proxy_upload
        original_method  = request.method
        original_params  = add_branch_to_params(request.query_parameters)
        original_payload = request.request_parameters[controller_name]
        resource         = "uploads/#{params[:id]}"
        if params[:file]
          original_payload = get_file_data(params)
        end
        client = get_api_client
        Rails.logger.debug("Proxy upload original_payload : #{original_payload}")
        res = client.call_tapi(original_method, resource, original_params, original_payload, nil)
        render status: res[:code] , json: res[:data]
      end

      def get_branch_info
        uuid = User.current.login
        begin
          org = get_organization(uuid)
          major,minor,build = get_plugin_parent_version.scan(/\d+/)
          client_id = {:remote_leaf => uuid ,
                       :remote_branch => get_branch_id_for_uuid(uuid),
                       :display_name => org.name,
                       :hostname => request.host,
                       :product => {:type => get_plugin_parent_name,
                                    :major_version => major,
                                    :minor_version => minor
                                    }
                       }
          render :json => client_id.to_json
        rescue RedhatAccess::Telemetry::LookUps::RecordNotFound => e
          http_error_response(e.message, 400)
        end
      end



      protected

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
    end
  end
end
