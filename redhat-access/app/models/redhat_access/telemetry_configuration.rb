module RedhatAccess
  class TelemetryConfiguration < ActiveRecord::Base
    include Encryptable
    belongs_to :organization ,:class_name => "Organization", :inverse_of => :telemetry_configuration
    encrypts :portal_password
    attr_accessible :enable_telemetry, :portal_password, :portal_user, :organization_id, :email
    self.include_root_in_json = false
    def name
      return "TelemetryConfiguration"
    end
  end
end
