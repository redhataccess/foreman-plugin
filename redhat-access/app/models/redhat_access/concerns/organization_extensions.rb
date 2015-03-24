module RedhatAccess
  module Concerns
    module OrganizationExtensions
      extend ActiveSupport::Concern
      included do
        has_one :telemetry_configuration, :class_name => "RedhatAccess::TelemetryConfiguration", :dependent => :destroy
      end
    end
  end
end
