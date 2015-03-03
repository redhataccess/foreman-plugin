require_dependency "redhat_access/application_controller"
require File.expand_path('../../../services/redhat_access/authentication/client_authentication.rb', __FILE__)


module RedhatAccess
  class TelemetryApiController < ApplicationController

    include RedhatAccess::Authentication::ClientAuthentication
    #TODO clean up filters once the API is split up
    skip_before_filter :authorize,  :except => [:proxy]
    skip_before_filter :require_login, :except => [:proxy]
    skip_before_filter :session_expiry, :except => [:proxy]
    skip_before_filter :verify_authenticity_token, :except => [:proxy]
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
    # TODO - separate UI api?
    def proxy
      #TODO err out if org is not selected
      original_method   =  request.method
      original_parms    = request.query_parameters
      original_payload  = request.request_parameters[:telemetry_api]

      resource = params[:path].split("/")[0]

      begin
        if SUBSETTED_RESOURCES.has_key?(resource)
          response = do_subset_call(params, { params: original_parms, method: original_method, payload: original_payload })
          render json: response
          return
        else
          url = "#{API_URL}/#{params[:path]}"
          ldebug "Doing non subset call to #{url}"
          client = default_rest_client(url, { params: original_parms, method: original_method, payload: original_payload })
          puts "TEST2"
          response = client.execute
          render json: response
          return
        end
      rescue RestClient::ExceptionWithResponse => e
        render status: e.response.code, json: {
          error: e,
          code:  e.response.code
        }
        # rescue Exception => e
        #   lerror "Caught unexcpected error when proxying call to tapi"
        #   render status: 500, json: {
        #            code:  500,
        #            error: e.to_s
        #          }
      end
    end

    def action_permission
      case params[:action]
      when 'proxy'
        :proxy
      else
        super
      end
    end

    # Handle uploading dvargas report to strata
    # TODO - separate client machine api?
    def upload_sosreport
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

        # request[:payload] = {
        #   :file => params[:file],
        #   :filename => params[:file].original_filename
        # }

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
    # TODO - separate client machine api?
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

    # Get the branch and leaf ID for a client system
    # TODO - separate client machine api?
    def get_client_id
      #TODO check for non cert user
      uuid = User.current.login
      begin
        client_id = { :remote_leaf => uuid ,
                      :remote_branch => get_branch_id_for_uuid(uuid)}
        render :json => client_id.to_json
      rescue RecordNotFound => e
        http_error_response(e.message, 400)
      end
    end

    private
    class  RecordNotFound < StandardError
    end

    def http_error_response(msg,status)
      render json: { :message => msg }, :status => status
    end

    def lerror message
      logger.error "#{self.class.name}: #{message}"
    end

    def ldebug message
      logger.debug "#{self.class.name}: #{message}"
    end

    def get_ssl_options_for_uuid(uuid)
      org = get_organization(uuid)
      get_ssl_options_for_org org
    end

    def get_ssl_options_for_org(org ,ca_file)
      if org
        upstream = org.owner_details['upstreamConsumer']
        if !upstream || !upstream['idCert'] || !upstream['idCert']['cert'] || !upstream['idCert']['key']
          raise(RecordNotFound,'Unable to get portal SSL credentials. Missing org manifest?')
        else
          opts = {
            :ssl_client_cert => OpenSSL::X509::Certificate.new(upstream['idCert']['cert']),
            :ssl_client_key => OpenSSL::PKey::RSA.new(upstream['idCert']['key']),
            :ssl_ca_file => ca_file,
            :verify_ssl => ca_file ? OpenSSL::SSL::VERIFY_PEER : OpenSSL::SSL::VERIFY_NONE,
          }
        end
      else
        raise(RecordNotFound,'Organization not found or invalid')
      end
    end

    def get_content_host_by_fqdn(name)
      Katello::System.first(:conditions => { :name => name})
    end

    def get_content_host(uuid)
      system = Katello::System.first(:conditions => { :uuid => uuid })
    end

    def get_organization(uuid)
      system = get_content_host(uuid)
      system.nil? ? nil : Organization.find(system.environment.organization_id)
    end

    def get_branch_id_for_uuid(uuid)
      org = get_organization(uuid)
      get_branch_id_for_org org
    end

    def get_branch_id_for_org(org)
      if org
        if !org.owner_details['upstreamConsumer'] || !org.owner_details['upstreamConsumer']['uuid']
          ldebug('Org manifest not found or invalid in get_branch_id')
          raise(RecordNotFound,'Branch ID not found for organization')
        else
          branch_id =  org.owner_details['upstreamConsumer']['uuid']
        end
      else
        ldebug('Org not found or invalid in get_branch_id')
        raise(RecordNotFound,'Organization not found or invalid')
      end
    end

    def get_leaf_id(uuid)
      system = get_content_host(uuid)
      if system.nil?
        ldebug('Host not found or invalid')
        raise(RecordNotFound,'Host not found or invalid')
      end
      uuid
    end


    def resource_base
      @resource_base ||= Host.authorized(current_permission, Host)
    end



    def create_subset
      ldebug "First subset call failed, CACHE_MISS"
      subset_client = default_rest_client SUBSET_URL, { :method => :post, payload: { hash: get_hash(get_machines()), branch_id: get_branch_id, leaf_ids: get_machines }.to_json }
      response = subset_client.execute
    end

    # Makes at least one call to tapi, at most 3 when a subset needs to be created
    def do_subset_call params, conf
      ldebug "Doing subset call"
      # Try subset
      begin
        url = build_subset_url("#{params[:path]}")
        client = default_rest_client url, conf
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
      hosts = resource_base.search_for('').map(&:name)
      #hopefully we can refactor later to optimize
      hosts = hosts.map  do |i|
        host = get_content_host_by_fqdn(i)
        host.nil? ? nil : host.uuid
      end
      hosts.compact.sort
    end

    # Returns the branch id of the current org/account
    def get_branch_id
      #TODO err out if org is not selected
      return get_branch_id_for_org Organization.current
    end

    # Returns the machines hash used for /subset/$hash/
    def get_hash machines
      branch = get_branch_id
      hash   = Digest::SHA1.hexdigest machines.join
      return "#{branch}__#{hash}"
    end

    # Returns a client with auth already setup
    def default_rest_client url, override_options
      #If we are keeping basic auth, will need to have Org specific
      #credentials
      creds = get_creds
      # enable this once cert auth is fixed:
      # if User.current.is_a? RedhatAccess::Authentication::CertUser
      #   opts = {
      #     :method => :get,
      #     :url => url,
      #   }.merge(get_ssl_options_for_uuid(User.current.login))
      # else
      #   opts = {
      #     :method   => :get,
      #     :url      => url,
      #     :user     => creds.username,
      #     :password => creds.password,
      #   }
      # end
      opts = {
        :method   => :get,
        :url      => url,
        :user     => creds.username,
        :password => creds.password,
      }
      opts = opts.merge(override_options)

      if override_options[:params]
        opts[:url] = "#{url}?#{override_options[:params].to_query}"
        override_options.delete(:params)
      end

      if override_options[:method] == :post and override_options[:payload]
        opts[:headers] = { 'content-type' => 'application/json' }
        opts[:payload] = override_options[:payload]
      end

      return RestClient::Request.new(opts)
    end
  end
end
