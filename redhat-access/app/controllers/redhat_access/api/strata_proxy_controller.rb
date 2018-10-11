require_dependency "redhat_access/application_controller"
require 'rest_client'
require 'redhat_access_lib'
require 'uri'

module RedhatAccess
  module Api
    class StrataProxyController < TelemetryApiController

      def action_permission
        case params[:action]
        when 'call'
          :call
        else
          super
        end
      end

      def get_auth_opts(creds)
        #We only support pass through basic auth @see get_api_client method
        return {}
      end

      def index
        render :text => "Strata Telemetry API"
      end


      # The method that "proxies" tapi requests over to Strata
      def call
        original_method  = request.method
        original_params = request.query_parameters
        original_payload = request.request_parameters[controller_name]
        if request.post? && request.raw_post
             original_payload = request.raw_post.clone
        end

        if request.put?
           original_payload = request.body.read
        end
        resource = params[:path] == nil ?  "/" : params[:path]
        if params[:file]
          original_payload = get_file_data(params)
        end
        client = get_api_client
        res = client.call_strata(original_method, URI.escape(resource), original_params, original_payload, nil)
        #401 erros means our proxy is not configured right.
        #Change it to 502 to distinguish with local applications 401 errors
        resp_data = res[:data]
        if res[:code] == 401
          res[:code] = 502
          resp_data = {
            :message => 'Authentication to the Strata Service failed.'
          }
        end
        render status: res[:code] , json: resp_data #.gsub('https://api.access.redhat.com','https://192.168.121.13/redhat_access/strata/')
      end

      def get_api_client
         accept_hdr = request.headers['Accept']
         content_hdr = request.headers['Content-Type']
         headers = { 'accept' => accept_hdr}
         unless content_hdr.nil?
            headers['content-type'] = content_hdr
         end
         headers['Authorization'] = request.env['HTTP_AUTHORIZATION'] if request.env['HTTP_AUTHORIZATION']
         Rails.logger.debug("User agent for telemetry is #{get_http_user_agent}")
         strata_host = 'https://api.' + REDHAT_ACCESS_CONFIG[:strata_host]
         return RedhatAccess::Telemetry::PortalClient.new(strata_host,
                                                          strata_host,
                                                          nil,
                                                          self,
                                                          {:logger => Rails.logger,
                                                           :http_proxy => get_portal_http_proxy,
                                                           :user_agent => get_http_user_agent,
                                                           :headers => headers
                                                          })
       end
    end
  end
end
