require_dependency "redhat_access/application_controller"

module RedhatAccess
  class TelemetryConfigurationsController < ApplicationController
    def show
      #TODO require current ORG
      conf = Organization.current.telemetry_configuration
      if conf.nil?
        Rails.logger.error("building a conf object")
        conf = Organization.current.build_telemetry_configuration({:portal_password=>"",
                                                                   :portal_user=>"",
                                                                   :enable_telemetry=> false})
        conf.save
      end
      render json:  conf.to_json(:except => [ :id, :created_at, :portal_password ])
    end

    def update
      #TODO require current ORG
      conf = Organization.current.telemetry_configuration
      if conf
        begin
          if conf.update_attributes(JSON.parse(request.body.read))
          render json: {:message => "config updated"}
        else
          render json: {:error=>"Invalid parameters"}.to_json, status: 400
        end
        rescue=>e
          render json: {:error=>"Error processing update"}.to_json, status: 500
        end
      else
        render json: {:error=>"Configurationnotfound"}.to_json, status: 404
      end
    end

  end
end
