require_dependency "redhat_access/application_controller"
require File.expand_path('../../../services/redhat_access/authentication/client_authentication.rb', __FILE__)


module RedhatAccess
  class TelemetryApiController < ApplicationController

    include RedhatAccess::Authentication::ClientAuthentication
    skip_before_filter :authorize, :require_login, :session_expiry, :verify_authenticity_token
    before_filter :telemetry_auth

    require 'rest_client'

    STRATA_URL = "https://#{REDHAT_ACCESS_CONFIG[:strata_host]}"
    YAML_URL   = "#{STRATA_URL}/rs/telemetry/api/static/uploader.yaml"
    UPLOAD_URL = "#{STRATA_URL}/rs/telemetry"
    API_URL    = "#{UPLOAD_URL}/api/v1"
    SUBSET_URL = "#{API_URL}/subsets"

    SUBSETTED_RESOURCES = {
      "reports" => true,
      "systems" => true
    }

    def api_request?
      true
    end

    # Get the credentials to access Strata
    # This is BASIC auth for now, but should use cert auth for GA
    def get_creds
      return TelemetryProxyCredentials.limit(1)[0]
    end

    # The auth method for this controller
    def telemetry_auth
      authenticate_client
      unless  User.current.is_a? RedhatAccess::Authentication::CertUser
        authorize
      end
    end


    def index
      render :text => "Telemetry API"
    end

    # The method that "proxies" tapi requests over to Strata
    def proxy
      original_parms = request.query_parameters
      resource = params[:path].split("/")[0]

      begin
        if SUBSETTED_RESOURCES.has_key?(resource)
          response = do_subset_call params, original_parms
          render json: response
          return
        else
          url = "#{API_URL}/#{params[:path]}"
          ldebug "Doing non subset call to #{url}"
          client = default_rest_client url, { params: original_parms }
          response = client.execute
          render json: response
          return
        end
      rescue RestClient::ExceptionWithResponse => e
        render status: e.response.code, json: {
                 error: e,
                 code:  e.response.code
               }
      rescue Exception => e
        lerror "Caught unexcpected error when proxying call to tapi"
        render status: 500, json: {
                 code:  500,
                 error: e.to_s
               }
      end
    end

    # Handle uploading dvargas report to strata
    def upload_sosreport
      begin
        creds = get_creds
        request = default_rest_client :post, UPLOAD_URL

        request[:payload] = {
          :file => params[:file],
          :filename => params[:file].original_filename
        }

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


    # Grabs the PhoneHome YAML conf file
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

    private

    def lerror message
        logger.error "#{self.class.name}: #{message}"
    end

    def ldebug message
      logger.debug "#{self.class.name}: #{message}"
    end

    def create_subset
      ldebug "First subset call failed, CACHE_MISS"
      subset_client = default_rest_client SUBSET_URL, { :method => :post, payload: { hash: get_hash(get_machines()), leaf_ids: get_machines }.to_json }
      response = subset_client.execute
    end

    # Makes at least one call to tapi, at most 3 when a subset needs to be created
    def do_subset_call params, original_parms
      ldebug "Doing subset call"
      # Try subset
      begin
        url = build_subset_url("#{params[:path]}")
        client = default_rest_client url, { params: original_parms }
        response = client.execute
        ldebug "First subset call passed, CACHE_HIT"
        return response
      rescue RestClient::ExceptionWithResponse => e
        if e.response.code == 412
          create_subset

          # retry the original request
          ldebug "Subset creation passed calling newly created subset"
          response = client.execute
          return response
        else
          raise e
        end
      end
    end

    # Transforms the URL that the user requested into the subsetted URL
    def build_subset_url url
      url = "#{SUBSET_URL}/#{get_hash get_machines}/#{url}"
      ldebug "build_subset_url #{url}"
      return url
    end

    # Returns an array of the machine IDs that this user has access to
    def get_machines
      return [ 'foo', 'bar', 'baz', 'bangz' ].sort
    end

    # Returns the machines hash used for /subset/$hash/
    def get_hash machines
      return Digest::SHA1.hexdigest machines.join
    end

    # Returns a client with auth already setup
    def default_rest_client url, options = { method: :get, payload: nil }
      options = { :method => :get, payload: nil, params: nil }.merge(options)

      creds = get_creds

      if options[:params]
        url = "#{url}?#{options[:params].to_query}"
      end

      opts = {
        :method   => options[:method],
        :url      => url,
        :user     => creds.username,
        :password => creds.password,
      }

      if options[:method] == :post and options[:payload]
        opts[:headers] = { 'content-type' => 'application/json' }
        opts[:payload] = options[:payload]
      end

      return RestClient::Request.new(opts)
    end
  end
end
