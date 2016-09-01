require_dependency "redhat_access/application_controller"

module RedhatAccess
  class TelemetryConfigurationsController < ApplicationController
    include RedhatAccess::Telemetry::LookUps
    def show
       #TODO require current ORG
      conf = get_telemetry_config(Organization.current)
      render json:  conf.to_json(:except => [ :id, :created_at, :portal_password ,:updated_at])
    end

    def update
      #TODO require current ORG
      conf = get_telemetry_config(Organization.current)
      if conf
        begin
          if conf.update_attributes(telemetry_configuration_params)
          render json: {:message => "config updated"}
        else
          render json: {:error=>"Invalid parameters"}.to_json, status: 400
        end
          rescue=>e
          Rails.logger.info(e)
          render json: {:error=>"Error processing update"}.to_json, status: 500
        end
      else
        render json: {:error=>"Configurationnotfound"}.to_json, status: 404
      end
    end

    private

    def telemetry_configuration_params
      params.require(:telemetry_configuration).permit(:enable_telemetry, :portal_password, :portal_user, :organization_id, :email)
    end

  end
end
