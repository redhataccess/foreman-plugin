module RedhatAccess
  module AnalyticsDashboardHelper
    include RedhatAccess::Telemetry::LookUps

    def help_path?
    	Rails.logger.error("Path is #{request.path}")
    	request.path == '/redhat_access/insights/help'
    end
  end
end
