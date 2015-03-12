class RedhatAccess::ApiController < ApplicationController
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
