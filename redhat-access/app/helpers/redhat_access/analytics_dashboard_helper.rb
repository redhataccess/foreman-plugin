module RedhatAccess
  module AnalyticsDashboardHelper
    include RedhatAccess::Telemetry::LookUps

    def help_path?
    	request.path == '/redhat_access/insights/help'
    end

    def manage_path?
      request.path == '/redhat_access/insights/manage'
    end
  end
end
