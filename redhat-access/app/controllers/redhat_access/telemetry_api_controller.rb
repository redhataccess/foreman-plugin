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

    # Returns an array of the machine IDs that this user has access to
    def get_machines
      hosts = resource_base.search_for('').map(&:name)
      #hopefully we can refactor later to optimize
      hosts = hosts.map  do |i|
        host = get_content_host_by_fqdn(i)
        host.nil? ? nil : host.uuid
      end
      hosts.compact.sort
    end

    def resource_base
      @resource_base ||= Host.authorized(current_permission, Host)
    end


    # The method that "proxies" tapi requests over to Strata
    def proxy

      begin
        #TODO err out if org is not selected
        #TODO improve error handling
        original_method  = request.method
        original_params  = request.query_parameters
        original_payload = request.request_parameters[:telemetry_api]
        resource         = params[:path] == nil ?  "/" : params[:path]

        if params[:filedata]
          original_payload = get_file_data(params)
        end

        client = RedhatAccess::Telemetry::PortalClient.new(STRATA_URL, get_creds, self, {:logger => logger})
        res = client.call_tapi(original_method, resource, original_params, original_payload, nil)
        render status: res.code, json: res

      rescue Exception => e
        Rails.logger.error(e.backtrace)
        http_error_response("Failed: #{e}", 500)
      end

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
