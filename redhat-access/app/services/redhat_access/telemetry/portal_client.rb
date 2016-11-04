require 'redhat_access_lib'
require 'forwardable'

module RedhatAccess
  module Telemetry
    class PortalClient < RedHatSupportLib::TelemetryApi::Client
      extend Forwardable
      include RedhatAccess::Telemetry::LookUps
      UPLOAD_HOST = REDHAT_ACCESS_CONFIG[:telemetry_upload_host]
      API_HOST = REDHAT_ACCESS_CONFIG[:telemetry_api_host]
      UPLOAD_URL = "#{UPLOAD_HOST}/r/insights/uploads"
      STRATA_URL = "#{API_HOST}/r/insights"

      delegate [:get_machines,:get_auth_opts,:get_current_organization] => :@context

      def initialize(creds, context, optional)
        super(UPLOAD_URL,STRATA_URL, creds, optional)
        @context = context
      end

      # Returns the branch id of the current org/account
      def get_branch_id
        organization = get_current_organization
        return get_branch_id_for_org(organization)
      end

    end
  end
end
