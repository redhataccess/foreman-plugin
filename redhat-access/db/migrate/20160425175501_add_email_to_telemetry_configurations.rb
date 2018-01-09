class AddEmailToTelemetryConfigurations < ActiveRecord::Migration[4.2]
  def change
    add_column :redhat_access_telemetry_configurations, :email, :string
  end
end
