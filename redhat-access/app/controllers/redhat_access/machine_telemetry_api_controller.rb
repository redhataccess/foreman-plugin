require_dependency "redhat_access/application_controller"
require 'rest_client'
require 'redhat_access_lib'

module RedhatAccess


  class MachineTelemetryApiController < TelemetryApiController

    skip_before_filter :authorize
    skip_before_filter :require_login
    skip_before_filter :session_expiry
    skip_before_filter :verify_authenticity_token
    before_filter :telemetry_auth

    def telemetry_auth
      authenticate_client
      unless  User.current.is_a? RedhatAccess::Authentication::CertUser
        deny_access
      end
    end

    # Get the credentials to access Strata
    # This is BASIC auth for now, but should use cert auth for GA
    def get_creds
      # enable this once cert auth is fixed:
      # return User
      return TelemetryProxyCredentials.limit(1)[0]
    end


    def get_branch_info
      #TODO check for non cert user
      uuid = User.current.login
      begin
        client_id = { :remote_leaf => uuid ,
                      :remote_branch => get_branch_id_for_uuid(uuid)}
        render :json => client_id.to_json
      rescue RedhatAccess::Telemetry::LookUps::RecordNotFound => e
        http_error_response(e.message, 400)
      end
    end
  end
end
