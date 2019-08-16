#require_dependency "redhat_access/application_controller"
require 'rest_client'
require 'redhat_access_lib'
require 'uri'

module RedhatAccess
  module Api
    class TelemetryApiController < RedhatAccess::Api::ApiController
      include RedhatAccess::Authentication::ClientAuthentication
      include RedhatAccess::Telemetry::LookUps



      before_filter :check_telemetry_enabled, :only => [:proxy]


      def action_permission
        case params[:action]
        when 'proxy'
          :proxy
        when 'connection_status'
          :connection_status
        else
          super
        end
      end

      def check_telemetry_enabled
        render_telemetry_off unless telemetry_enabled?(current_organization)
      end

      def render_telemetry_off
        http_error_response("Telemetry is not enabled for your organization",403)
      end

      def get_creds
        # enable this once cert auth is fixed:
        # return User
        #return TelemetryProxyCredentials.limit(1)[0]
      end

      def get_auth_opts(creds)
        return get_ssl_options_for_org(current_organization ,nil)
      end

      def index
        render :text => "Telemetry API"
      end


      # # Returns an array of the machine IDs that this user has access to
      def get_machines
        #TODO err out if org is not selected
        machines = get_content_hosts(current_organization)
        if machines.empty?
          machines = ['NULL_SET']
        end 
        machines.sort
      end


      def get_current_organization
          current_organization
      end

      def connection_status
        client = get_api_client
        res = client.call_tapi('GET', 'me', nil, nil, nil)
        Rails.logger.debug(res[:data])
        case res[:code]
        when 200
          resp = JSON.parse(res[:data])
          data = {
            :connectionStatus => 'Connected',
            :account => resp["account_number"],
            :company => resp["company"],
            :orgId  => resp["ord_id"]
          }
          render status: res[:code] , json: data
        when 401
          data = {
            :connectionStatus => 'Authentication Failure',
            :account => 'Unknown',
            :company => 'Unknown',
          }
          render status: 200 , json: data
        else
          data = {
            :connectionStatus => 'Connection Failed',
            :account => 'Unknown',
            :company => 'Unknown',
          }
          render status: 200 , json: data
        end
      end

      # The method that "proxies" tapi requests over to Strata
      def proxy
        original_method = request.method
        original_params = request.query_parameters
        if request.user_agent and not request.user_agent.include?('redhat_access_cfme')
          original_params = add_branch_to_params(request.query_parameters)
        end
        original_payload = request.request_parameters[controller_name]
        if request.post? && request.raw_post
          original_payload = request.raw_post.clone
        elsif request.put?
          original_payload = request.body.read
        end
        resource = params[:path] == nil ? "/" : params[:path]

        if params[:file]
          original_payload = get_file_data(params)
        elsif request.format.json? && request.patch? && original_payload
          # because rails behaves stupidly for http PATCH:
          original_payload = original_payload.to_json unless original_payload.is_a? String
        end

        client = get_api_client
        res = client.call_tapi(original_method, URI.escape(resource), original_params, original_payload, nil, use_subsets)
        #401 erros means our proxy is not configured right.
        #Change it to 502 to distinguish with local applications 401 errors
        resp_data = res[:data]
        if res[:code] == 401
          res[:code] = 502
          resp_data = {
              :message => 'Authentication to the Insights Service failed.',
              :headers => {}
          }
        end
        if resp_data.respond_to?(:headers)
          if resp_data.headers[:content_disposition]
            send_data resp_data, disposition: resp_data.headers[:content_disposition], type: resp_data.headers[:content_type]
            return
          end
          if resp_data.headers[:x_resource_count]
            response.headers['x-resource-count'] = resp_data.headers[:x_resource_count]
          end
          render status: res[:code], json: resp_data
        else
          render status: res[:code], json: resp_data
        end
      end


      protected

      def use_subsets
        true
      end

      def get_file_data params
        data            = {}
        data[:file]     = params[:file]
        data[:metadata] = params[:metadata] if params[:metadata]  # include the metadata part if present
        return data
      end

      def add_branch_to_params(params)
        if params.nil?
          params = {}
        end
        params[:branch_id] = get_branch_id
        Rails.logger.debug{"Request parameters for telemetry request #{params}"}
        params
      end


      def get_branch_id
        get_branch_id_for_org(current_organization)
      end

      def get_api_client
        Rails.logger.debug("User agent for telemetry is #{get_http_user_agent}")
        if User.current

        end
        return RedhatAccess::Telemetry::PortalClient.new(nil,
                                                         nil,
                                                         get_creds,
                                                         self,
                                                         get_http_options(true))
      end

      def api_version
        'v1'
      end

    end
  end
end
