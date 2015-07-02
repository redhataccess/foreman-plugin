require_dependency "redhat_access/application_controller"
require 'rest_client'
require 'redhat_access_lib'

module RedhatAccess
  module Api
    class TelemetryApiController < RedhatAccess::Api::ApiController
      include RedhatAccess::Authentication::ClientAuthentication
      include RedhatAccess::Telemetry::LookUps

      before_filter :check_telemetry_enabled, :only => [:proxy]

      UPLOAD_HOST = "https://#{REDHAT_ACCESS_CONFIG[:telemetry_upload_host]}"
      API_HOST = "https://#{REDHAT_ACCESS_CONFIG[:telemetry_api_host]}"
      UPLOAD_URL = "#{UPLOAD_HOST}/r/insights/uploads"
      STRATA_URL = "#{API_HOST}/r/insights"

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
        render_telemetry_off unless telemetry_enabled?(Organization.current)
      end

      def render_telemetry_off
        http_error_response("Telemetry is not enabled for your organization",403)
      end

      def get_creds
        # enable this once cert auth is fixed:
        # return User
        #return TelemetryProxyCredentials.limit(1)[0]
      end

      def get_auth_opts()
        return get_ssl_options_for_org(Organization.current ,nil)
      end

      def index
        render :text => "Telemetry API"
      end


      # # Returns an array of the machine IDs that this user has access to
      def get_machines
        #TODO err out if org is not selected
        machines = get_content_hosts(Organization.current)
        if machines.empty? 
          machines = ['NULL_SET']
        end
        Rails.logger.debug("Machines : #{machines}")
        machines
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
        original_method  = request.method
        original_params  = add_branch_to_params(request.query_parameters)
        original_payload = request.request_parameters[controller_name]
        resource         = params[:path] == nil ?  "/" : params[:path]
        if params[:file]
          original_payload = get_file_data(params)
        end
        client = get_api_client
        res = client.call_tapi(original_method, resource, original_params, original_payload, nil)
        #401 erros means our proxy is not configured right.
        #Change it to 502 to distinguish with local applications 401 errors
        if res[:code] == 401
          res[:code] = 502
        end
        render status: res[:code] , json: res[:data]
      end

      protected

      def get_file_data params
        return {
          :file => params[:file],
          :filename => params[:file].original_filename
        }
      end

      def add_branch_to_params(params)
        if params.nil?
          params = {}
        end
        params[:branch_id] = get_branch_id
        Rails.logger.debug{"Request parameters for telemetry request #{params}"}
        params
      end

      def get_http_user_agent
        "#{get_plugin_parent_name}/#{get_plugin_parent_version};#{get_rha_plugin_name}/#{get_rha_plugin_version}"
      end

      def get_branch_id
        get_branch_id_for_org(Organization.current)
      end

      def get_api_client
        Rails.logger.debug("User agent for telemetry is #{get_http_user_agent}")
        return RedhatAccess::Telemetry::PortalClient.new(UPLOAD_URL,STRATA_URL,
                                                         get_creds,
                                                         self,
                                                         {:logger => Rails.logger,
                                                          :http_proxy => get_portal_http_proxy,
                                                          :user_agent => get_http_user_agent})
      end
      
      def api_version
        'v1'
      end

    end
  end
end
