require_dependency "redhat_access/application_controller"

module RedhatAccess
  class LogsController < ApplicationController


    def index
      #
      # This REST hack of using index for both list and specific resource get
      # is being forced by the current UI design
      #
      render :text => "/home/lindani/production.log",
        :layout => false
    end
  end
end
