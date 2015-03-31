require_dependency "redhat_access/application_controller"

module RedhatAccess
  class TelemetryConfigurationController < ApplicationController
    def index
      conf = Organization.current.telemetry_configuration
      if conf.nil?
        Rails.logger.error("building a conf object")
        conf = Organization.current.build_telemetry_configuration({:portal_password=>"",
                                                                   :portal_user=>"",
                                                                   :enable_telemetry=> false})
        #    t.string :portal_user
        # t.string :portal_password
        # t.boolean :enable_telemetry
        # t.integer :organization_id
        conf.save
      end
      Rails.logger.error("hello dolly! #{conf.enable_telemetry}")
      conf.enable_telemetry = true
      conf.save
    end

    def create
    end

    def update
    end

    def destroy
    end
  end
end
