require_dependency "redhat_access/application_controller"

module RedhatAccess
  class AnalyticsDashboardController < ApplicationController
    def index
    end

    def template
      render template: "redhat_access/analytics_dashboard/#{params[:page]}", :layout => false
    end
  end
end
