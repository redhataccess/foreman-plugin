require 'redhat_access_lib'

module RedhatAccess
  module Telemetry
    class PortalClient < RedHatSupportLib::TelemetryApi::Client

      include RedhatAccess::Telemetry::LookUps

      def initialize(strata_url, creds, context, optional)
        super(strata_url, creds, optional)
        @context = context
      end

      def get_machines
        @context.get_machines
      end

      # Returns the branch id of the current org/account
      def get_branch_id
        #TODO err out if org is not selected
        return get_branch_id_for_org Organization.current
      end

      def get_auth_opts creds
        if creds.is_a?(User) and  User.current.is_a? RedhatAccess::Authentication::CertUser
          opts = get_ssl_options_for_uuid(User.current.login)
        elsif creds.is_a?(TelemetryProxyCredentials)
          opts = {
            :user     => creds.username,
            :password => creds.password

          }
        end
        return opts
      end
    end
  end
end
