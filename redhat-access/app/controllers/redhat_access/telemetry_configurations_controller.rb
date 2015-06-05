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
