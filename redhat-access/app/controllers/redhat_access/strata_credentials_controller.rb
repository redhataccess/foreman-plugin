require_dependency "redhat_access/application_controller"

module RedhatAccess
  class StrataCredentialsController < ApplicationController

    def index
      if TelemetryProxyCredentials.count == 0
        render json: { :status => 'not_found' }, status: 404
        return
      end

      # conf = Organization.current.telemetry_configuration
      # if conf.nil?
      #   Rails.logger.error("building a conf object")
      #   conf = Organization.current.build_telemetry_configuration({:portal_password=>"",
      #                                                              :portal_user=>"",
      #                                                              :enable_telemetry=> false})
      #   #    t.string :portal_user
      #   # t.string :portal_password
      #   # t.boolean :enable_telemetry
      #   # t.integer :organization_id

      #   conf.save
      # end
      # Rails.logger.error("hello dolly! #{conf.enable_telemetry}")
      # conf.enable_telemetry = true
      # conf.save
      creds = TelemetryProxyCredentials.limit(1)[0]
      render json: { :status => 'success', :username => creds.username }
    end

    def destroy
      TelemetryProxyCredentials.delete_all
      render json: { :status => 'success' }
    end

    def create
      if TelemetryProxyCredentials.count != 0
        TelemetryProxyCredentials.delete_all
      end

      creds = TelemetryProxyCredentials.new

      data = params[:strata_credential]
      username = data[:username]
      password = data[:password]

      if not username.present? && username.length > 1
        render json: { :status => 'error', :message => 'username missing or too short' }, status: 400
        return
      end

      if not password.present? && password.length > 4
        render json: { :status => 'error', :message => 'password missing or too short' }, status: 400
        return
      end

      creds.attributes = { username: username, password: password }
      creds.save

      render json: { :status => 'success', :message => 'credentials saved' }
    end
  end
end
