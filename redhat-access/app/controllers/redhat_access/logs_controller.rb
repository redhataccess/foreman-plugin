require_dependency "redhat_access/application_controller"

module RedhatAccess
  class LogsController < ApplicationController


    def index
      #
      # This REST hack of using index for both list and specific resource get
      # is being forced by the current UI design
      #
      path = params[:path]
      if path.nil?
        render :text => "/var/log/foreman/production.log\n/var/log/foreman/delayed_job.log\n/var/log/foreman/jobs-startup.log",
          :layout => false
      else
        # TEMPORARY implementation for demo - needs sanatizing to make secure!
        render :file => path,
          :layout => false
      end
    end
  end
end
