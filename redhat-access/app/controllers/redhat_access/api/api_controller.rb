require_dependency "redhat_access/application_controller"
module RedhatAccess
  module Api
    class ApiController < ApplicationController
      #skip_before_filter :verify_authenticity_token, :unless => :protect_api_from_forgery?
      #before_filter :set_default_response_format, :authorize, :add_version_header, :set_gettext_locale
      before_filter :session_expiry, :update_activity_time
      #around_filter :set_timezone

      cache_sweeper :topbar_sweeper

      respond_to :json

      def http_error_response(msg,status)
        render json: { :message => msg }, :status => status
      end

      def api_request?
        true
      end

    end
  end
end
