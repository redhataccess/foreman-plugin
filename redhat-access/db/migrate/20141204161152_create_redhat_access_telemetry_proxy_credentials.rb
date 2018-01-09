class CreateRedhatAccessTelemetryProxyCredentials < ActiveRecord::Migration[4.2]
  def change
    create_table :redhat_access_telemetry_proxy_credentials do |t|
      t.string :username
      t.string :password
      t.string :strata_url

      t.timestamps
    end
  end
end
