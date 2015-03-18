require_dependency "redhat_access/application_controller"

module RedhatAccess
  class AnalyticsDashboardController < ApplicationController
    def index
      #TODO also check if subscription manifest is available
      #TODO what to do when there are no content hosts?
      if Organization.current.nil?
        render 'redhat_access/redhat_access/org_required'
      else
        render 'redhat_access/analytics_dashboard/index'
      end
    end
  end
end
