# require 'fast_gettext'
# require 'gettext_i18n_rails'

module RedhatAccess
  class Engine < ::Rails::Engine
    isolate_namespace RedhatAccess

    initializer 'redhat_access.load_app_instance_data' do |app|
      app.config.paths['db/migrate'] += RedhatAccess::Engine.paths['db/migrate'].existent
    end

    initializer 'redhat_access.mount_engine', :after => :build_middleware_stack do |app|
      app.routes_reloader.paths << "#{RedhatAccess::Engine.root}/config/mount_engine.rb"
      app.reload_routes!
    end

    initializer :register_assets do |app|
      if Rails.env.production?
        assets = YAML.load_file("#{RedhatAccess::Engine.root}/public/assets/manifest.yml")
        assets.each_pair do |file, digest|
          app.config.assets.digests[file] = digest
        end
      end
    end

    initializer :security_initialization do |app|
      app.config.filter_parameters << :authToken
    end

    initializer :config_csp_headers do |app|
      ::SecureHeaders::Configuration.configure do |config|
        Rails.logger.info "init config for #{config}"
        if config && config.csp
          if config.csp[:frame_src]
            config.csp[:frame_src] = config.csp[:frame_src] << ' *.redhat.com  *.force.com'
          end
          if config.csp[:connect_src]
            config.csp[:connect_src] = config.csp[:connect_src] << ' *.redhat.com'
          end
          if config.csp[:script_src]
            config.csp[:script_src] = config.csp[:script_src] << ' *.redhat.com'
          end
          if config.csp[:img_src]
            config.csp[:img_src] = config.csp[:img_src] << ' *.redhat.com'
          end
        end
      end
    end

    initializer 'redhat_access.register_gettext', :after => :load_config_initializers do |app|
      locale_dir = File.join(File.expand_path('../../..', __FILE__), 'locale')
      locale_domain = 'redhat_access'
      Foreman::Gettext::Support.add_text_domain locale_domain, locale_dir
    end

    initializer 'redhat_access.register_plugin', :after=> :finisher_hook do |app|
      Foreman::Plugin.register :redhat_access do
        requires_foreman '> 1.4'

        # permission section
        security_block :redhat_access_security do
          #Everything except logs should be available to all users
          permission :view_search, {:"redhat_access/search" => [:index] } ,  :public => true
          permission :view_cases, {:"redhat_access/cases" => [:index, :create] } ,  :public => true
          permission :attachments, {:"redhat_access/attachments" => [:index, :create] } ,  :public => true
          permission :configuration, {:"redhat_access/configuration" => [:index] } ,  :public => true
          permission :app_root, {:"redhat_access/redhat_access" => [:index] },  :public => true

          #Logs require special permissions
          permission :view_log_viewer, {:"redhat_access/log_viewer" => [:index] }
          permission :logs, {:"redhat_access/logs" => [:index] }

          #Proactive Diagnostics permissions
          # permission :rh_telemetry_api, { :"redhat_access/telemetry_api" => [:index,:upload_sosreport,:get_ph_conf] }
          # permission :rh_telemetry_view, { :"redhat_access/telemetry" => [:index] }
          # permission :rh_telemetry_creds, { :"redhat_access/strata_credentials" => [:index, :destroy, :create] }

        end

        #roles section
        #role "Red Hat Access", [:view_search,:view_cases,:attachments, :configuration]
        role "Red Hat Access Logs", [:logs,:view_log_viewer]
        #role "Red Hat Proactive Support" , [:rh_telemetry_api, :rh_telemetry_view, :rh_telemetry_creds]

        #menus
        sub_menu :header_menu, :redhat_access_menu, :caption=> N_('Red Hat Access') do
          menu :header_menu,
            :Search,
            :url_hash => {:controller=> :"redhat_access/search" , :action=>:index},
            :engine => RedhatAccess::Engine
          menu :header_menu,
            :LogViewer,
            :url_hash => {:controller=> :"redhat_access/log_viewer" , :action=>:index},
            :engine => RedhatAccess::Engine,
            :caption=> N_('Logs')
          # menu :header_menu,
          #   :Telemetry,
          #   :url_hash => {:controller=> :"redhat_access/telemetry" , :action=>:index},
          #   :caption=> N_('Proactive Support'),
          #   :engine => RedhatAccess::Engine
          divider :header_menu, :parent => :redhat_access_menu, :caption => N_('Support')
          menu :header_menu,
            :mycases,
            :url_hash => {:controller=> :"redhat_access/cases" , :action=>:index},
            :engine => RedhatAccess::Engine,
            :caption=> N_('My Cases')
          menu :header_menu, :new_cases, :caption=> N_('Open New Case'),
            :url_hash => {:controller=> :"redhat_access/cases", :action=>:create },
            :engine => RedhatAccess::Engine
        end
      end
    end
  end
end
