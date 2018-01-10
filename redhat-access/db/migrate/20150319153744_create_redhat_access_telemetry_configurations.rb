class CreateRedhatAccessTelemetryConfigurations < ActiveRecord::Migration[4.2]
  def change
    create_table :redhat_access_telemetry_configurations do |t|
      t.string :portal_user
      t.string :portal_password
      t.boolean :enable_telemetry
      t.integer :organization_id

      t.timestamps
    end
    add_index :redhat_access_telemetry_configurations, :organization_id
  end
end
