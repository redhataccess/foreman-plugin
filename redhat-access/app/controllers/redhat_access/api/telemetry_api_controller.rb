require_dependency "redhat_access/application_controller"
require 'rest_client'
require 'redhat_access_lib'

module RedhatAccess
  module Api
    class TelemetryApiController < ApiController
      include RedhatAccess::Authentication::ClientAuthentication
      include RedhatAccess::Telemetry::LookUps

      UPLOAD_HOST = "https://#{REDHAT_ACCESS_CONFIG[:telemetry_upload_host]}"
      API_HOST = "https://#{REDHAT_ACCESS_CONFIG[:telemetry_api_host]}"
      #STRATA_URL = "https://cert-api.access.redhat.com"
      # Get the credentials to access Strata
      # This is BASIC auth for now, but should use cert auth for GA
      UPLOAD_URL = "#{UPLOAD_HOST}/rs/telemetry"
      STRATA_URL = "#{API_HOST}/rs/telemetry/api"

      def get_creds
        # enable this once cert auth is fixed:
        # return User
        return TelemetryProxyCredentials.limit(1)[0]
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
        return get_content_hosts(Organization.current)
      end

      # The method that "proxies" tapi requests over to Strata
      def proxy
        original_method  = request.method
        original_params  = request.query_parameters
        original_payload = request.request_parameters[:telemetry_api]
        resource         = params[:path] == nil ?  "/" : params[:path]
        if params[:file]
          original_payload = get_file_data(params)
        end
        client = get_api_client
        res = client.call_tapi(original_method, resource, original_params, original_payload, nil)
        render status: res[:code] , json: res[:data]
      end

      protected

      def get_file_data params
        return {
          :file => params[:file],
          :filename => params[:file].original_filename
        }
      end

      def get_api_client
        return RedhatAccess::Telemetry::PortalClient.new(UPLOAD_URL,STRATA_URL, get_creds, self, {:logger => Rails.logger})
      end

    end
  end
end
