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
    end
  end
end
