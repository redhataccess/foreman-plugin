require_dependency "redhat_access/application_controller"
module RedhatAccess
  module Api
    class ApiController < ApplicationController
      def action_permission
        case params[:action]
        when 'proxy'
          :proxy
        else
          super
        end
      end

      def http_error_response(msg,status)
        render json: { :message => msg }, :status => status
      end

      def api_request?
        true
      end

    end
  end
end
