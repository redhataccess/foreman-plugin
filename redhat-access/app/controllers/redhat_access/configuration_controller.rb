require_dependency "redhat_access/application_controller"
require_dependency "redhat_access/version"

module RedhatAccess
  class ConfigurationController < ApplicationController
    def index
      strata_host = REDHAT_ACCESS_CONFIG[:strata_host]
      if strata_host.nil?
        strata_host = 'access.redhat.com'
      end
      client_id = "foreman_plugin_#{REDHAT_ACCESS_CONFIG[:deployment]}_#{RedhatAccess::VERSION}"
      render :json => { :strataHostName => strata_host,:strataClientId => client_id }.to_json,
        :layout => false
    end
  end
end
