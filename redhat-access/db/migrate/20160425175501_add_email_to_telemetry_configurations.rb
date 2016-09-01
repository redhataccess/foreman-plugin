class AddEmailToTelemetryConfigurations < ActiveRecord::Migration
  def change
    add_column :redhat_access_telemetry_configurations, :email, :string
  end
end
