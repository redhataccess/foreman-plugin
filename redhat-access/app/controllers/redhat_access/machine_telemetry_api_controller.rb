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
      unless valid_machine_user?
        deny_access
      end
    end

    def get_auth_opts()
      if valid_machine_user?
        get_ssl_options_for_uuid(User.current.login, nil)
      else
        raise(RedhatAccess::Telemetry::LookUps::RecordNotFound,'Invalid User')
      end
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

    def valid_machine_user?
      if User.current && User.current.is_a?(RedhatAccess::Authentication::CertUser)
        unless get_content_host(User.current.login).nil?
          return true
        end
      else
        return false
      end
    end
  end
end
