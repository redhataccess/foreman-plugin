module RedhatAccess
  class TelemetryProxyCredentials < ActiveRecord::Base
    include Encryptable
    encrypts :password

    def name
      return "TelemetryProxyCredentials"
    end
  end
end
