require_dependency "redhat_access/application_controller"
require 'rest_client'
require 'redhat_access_lib'

module RedhatAccess


  class TelemetryApiController < ApiController

    include RedhatAccess::Authentication::ClientAuthentication
    include RedhatAccess::Telemetry::LookUps

    STRATA_URL = "https://#{REDHAT_ACCESS_CONFIG[:strata_host]}"

    # Get the credentials to access Strata
    # This is BASIC auth for now, but should use cert auth for GA
    def get_creds
      # enable this once cert auth is fixed:
      # return User
      return TelemetryProxyCredentials.limit(1)[0]
    end

    def index
      render :text => "Telemetry API"
    end

    # The method that "proxies" tapi requests over to Strata
    def proxy

      #TODO err out if org is not selected
      #TODO improve error handling
      original_method  = request.method
      original_params  = request.query_parameters
      original_payload = request.request_parameters[:telemetry_api]
      resource         = params[:path] == nil ?  "/" : params[:path]

      if params[:filedata]
        original_payload = get_file_data(params)
      end

      client = RedhatAccess::Telemetry::PortalClient.new STRATA_URL, get_creds, {:logger => logger}

      res = client.call_tapi(original_method, resource, original_params, original_payload, nil)

      render status: res[:code], json: res[:data]
    end

    private

    def get_file_data params
      return {
        :file => params[:filedata],
        :filename => params[:filedata].original_filename
      }
    end

  end
end
