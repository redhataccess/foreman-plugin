module RedhatAccess
  module AnalyticsDashboardHelper
    def is_susbcribed_to_redhat?(org)
      if org
        upstream = org.owner_details['upstreamConsumer']
        return upstream && upstream['idCert']
      end
      return false
    end

    def is_org_selected?
      return Organization.current
    end

    def is_telemetry_enabled?
      true
    end
  end
end
