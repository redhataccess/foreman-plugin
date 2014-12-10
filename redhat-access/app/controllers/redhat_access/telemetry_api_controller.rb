require_dependency "redhat_access/application_controller"
require File.expand_path('../../../services/redhat_access/authentication/client_authentication.rb', __FILE__)


module RedhatAccess
  class TelemetryApiController < ApplicationController

    include RedhatAccess::Authentication::ClientAuthentication
    skip_before_filter :authorize, :require_login, :session_expiry, :verify_authenticity_token
    before_filter :telemetry_auth

    STRATA_URL="https://#{REDHAT_ACCESS_CONFIG[:strata_host]}"

    YAML_URL="#{STRATA_URL}/rs/telemetry/api/static/uploader.yaml"
    UPLOAD_URL="#{STRATA_URL}/rs/telemetry"

    def get_creds
      return TelemetryProxyCredentials.limit(1)[0]
    end

    def telemetry_auth
      authenticate_client
      unless  User.current.is_a? RedhatAccess::Authentication::CertUser
        authorize
      end
    end

    def api_request?
      true
    end

    def index
      render :text => "Telemetry API"
    end

    def upload_sosreport
      require 'rest_client'
      begin
        creds = get_creds
        request = RestClient::Request.new(
          :method => :post,
          :url => UPLOAD_URL,
          :user => creds.username,
          :password => creds.password,
          :payload => {
            :file => params[:file],
            :filename => params[:file].original_filename
          }
        )
        response = request.execute
      rescue Exception => e
        message = "Unknown error uploading #{params[:file].original_filename} to #{UPLOAD_URL}: #{e.message}"
        e.backtrace.inspect
        status = 500
        if response
          status = response.code || 500
        end
        render json: { :status => "error", :message => message }, :status => status
        return
      end

      if response.code != 201
        message = "Error uploading #{params[:file].original_filename} to #{UPLOAD_URL}: #{response.description}"
        logger.error message
        status = response.code || 500
        render json: { :status => "error", :message => message }, :status => status
        return
      end

      render json: { :status => "success" }
    end

    def get_ph_conf
      require 'rest_client'

      begin
        creds = get_creds
        resource = RestClient::Resource.new YAML_URL, :user => creds.username, :password => creds.password
        response = resource.get
      rescue Exception => e
        message = "Unknown error downloading uploader.yml from #{YAML_URL}: #{e.message}"
        e.backtrace.inspect
        render text: message
        return
      end

      if response.code != 200
        message = "Error downloading uploader.yaml from #{YAML_URL}: #{response.description}"
        logger.error message
        render text: message
      end

      render text: response.to_str
    end
  end
end
