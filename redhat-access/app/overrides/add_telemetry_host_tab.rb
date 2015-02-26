Deface::Override.new(:virtual_path  => 'hosts/show',
                     :name          => 'add_telemetry_tab_pane',
                     :insert_bottom => 'div.tab-content',
                     :partial       => 'redhat_access/telemetry/host_tab'
                     )
