# require 'fast_gettext'
# require 'gettext_i18n_rails'
# require 'deface'
require 'katello'
begin
  # Since we depend on katello, need to force it load so our plugin
  # dependency checks can work properly
  require 'foreman_sam.rb'
rescue Exception => error
  # don't need to do anything
end

module RedhatAccess
  class Engine < ::Rails::Engine
    isolate_namespace RedhatAccess

    initializer 'redhat_access.load_app_instance_data' do |app|
      unless app.root.to_s.match root.to_s
        config.paths["db/migrate"].expanded.each do |expanded_path|
          app.config.paths["db/migrate"] << expanded_path
        end
      end
    end

    initializer 'redhat_access.mount_engine', :after => :build_middleware_stack do |app|
      app.routes_reloader.paths << "#{RedhatAccess::Engine.root}/config/mount_engine.rb"
      app.reload_routes!
    end

    # Precompile any JS or CSS files under app/assets/
    # If requiring files from each other, list them explicitly here to avoid precompiling the same
    # content twice.
    assets_to_precompile = [
      'redhat_access/application.js',
      'redhat_access/application.css',
      'insights/application.js',
      'insights/application.css'
    ]
    initializer 'redhat_access.assets.precompile' do |app|
      app.config.assets.precompile += assets_to_precompile
    end
    initializer 'redhat_access.configure_assets', :group => :assets do
      SETTINGS[:redhat_access] = {:assets => {:precompile => assets_to_precompile}}
    end

    initializer :security_initialization do |app|
      app.config.filter_parameters << :authToken
    end

    initializer 'redhat_access.register_gettext', :after => :load_config_initializers do |_app|
      locale_dir = File.join(File.expand_path('../../..', __FILE__), 'locale')
      locale_domain = 'redhat_access'
      Foreman::Gettext::Support.add_text_domain locale_domain, locale_dir
    end

    initializer :config_csp_headers do |_app|
      ::SecureHeaders::Configuration.configure do |config|
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

    config.after_initialize do
      Foreman::Plugin.register :redhat_access do
        #
        # Start Monkey Patching
        # Implement our own (temp until we fix foreman upstream)
        #
        class RhaItem < Menu::Item
          def initialize(name, options)
            super(name, options)
          end

          def authorized?
            return false if @condition and not @condition.call
            User.current.allowed_to?(url_hash.slice(:controller, :action, :id))
          rescue => error
            Rails.logger.error "#{error.message} (#{error.class})\n#{error.backtrace.join("\n")}"
            false
          end
        end

        def rha_menu(menu, name, options = {})
          options.merge!(:parent => @parent) if @parent
          Menu::Manager.map(menu).push(RhaItem.new(name, options), options)
        end
        #
        # End monkey patching
        #

        def sam_deployment?
          # TODO: make generic and move to lib util class
          Foreman::Plugin.installed?('foreman_sam')
        end

        requires_foreman '> 1.6'
        requires_foreman_plugin 'katello', '> 3.0.0'


        # permission section
        security_block :redhat_access_security do
          # Everything except logs should be available to all users
          permission :view_search, {:"redhat_access/search" => [:index]},  :public => true
          permission :view_cases, {:"redhat_access/cases" => [:index, :create]},  :public => true
          permission :attachments, {:"redhat_access/attachments" => [:index, :create]},  :public => true
          permission :configuration, {:"redhat_access/configuration" => [:index]},  :public => true
          permission :app_root, {:"redhat_access/redhat_access" => [:index]},  :public => true

          # Logs require special permissions
          permission :view_log_viewer, {:"redhat_access/logviewer" => [:index]}
          permission :logs, {:"redhat_access/logs" => [:index]}

          unless sam_deployment?
            # Proactive Diagnostics permissions
            permission :rh_telemetry_api, {:"redhat_access/api/telemetry_api" => [:proxy, :connection_status]}
            permission :rh_telemetry_view, {:"redhat_access/analytics_dashboard" => [:index]}
            permission :rh_telemetry_configurations, {:"redhat_access/telemetry_configurations" => [:show, :update]}
          end
        end
        # roles section
        role "Red Hat Access Logs", [:logs, :view_log_viewer]
        unless sam_deployment?
          #Need to be kept in sync with db/seeds.d/20-update-insights-roles
          role "Access Insights Viewer", [:rh_telemetry_api, :rh_telemetry_view, :view_content_hosts]
          role "Access Insights Admin", [:rh_telemetry_api, :rh_telemetry_view, :rh_telemetry_configurations,:view_content_hosts]
        end
        # menus
        sub_menu :header_menu, :redhat_access_menu, :caption => N_('Red Hat Access') do
          menu :header_menu,
               :Search,
               :url      => '/redhat_access/search',
               :url_hash => {:controller => :"redhat_access/search", :action => :index},
               :engine   => RedhatAccess::Engine
          menu :header_menu,
               :LogViewer,
               :url      => '/redhat_access/logviewer',
               :url_hash => {:controller => :"redhat_access/logs", :action => :index},
               :engine   => RedhatAccess::Engine,
               :caption  => N_('Logs')
          divider :header_menu, :parent => :redhat_access_menu, :caption => N_('Support')
          menu :header_menu,
               :mycases,
               :url      => '/redhat_access/case/list',
               :url_hash => {:controller => :"redhat_access/cases", :action => :index},
               :engine   => RedhatAccess::Engine,
               :caption  => N_('My Cases')
          menu :header_menu, :new_cases, :caption  => N_('Open New Case'),
                                         :url      => '/redhat_access/case/new',
                                         :url_hash => {:controller => :"redhat_access/cases", :action => :create},
                                         :engine   => RedhatAccess::Engine
        end

        unless sam_deployment?
          sub_menu :top_menu, :redhat_access_top_menu, :caption => N_('Red Hat Insights') do
            rha_menu :top_menu,
                     :rhai_dashboard,
                     :caption  => N_('Overview'),
                     :url      => '/redhat_access/insights',
                     :url_hash => {:controller => :"redhat_access/analytics_dashboard", :action => :index},
                     :engine   => RedhatAccess::Engine
            rha_menu :top_menu,
                     :rhai_systems,
                     :caption  => N_('Systems'),
                     :url      => '/redhat_access/insights/systems/',
                     :url_hash => {:controller => :"redhat_access/analytics_dashboard", :action => :index},
                     :engine   => RedhatAccess::Engine
            rha_menu :top_menu,
                     :rhai_rules,
                     :caption  => N_('Rules'),
                     :url      => '/redhat_access/insights/rules/',
                     :url_hash => {:controller => :"redhat_access/analytics_dashboard", :action => :index},
                     :engine   => RedhatAccess::Engine
            rha_menu :top_menu,
                     :rhai_dashboardconfiguration,
                     :caption  => N_('Manage'),
                     :url      => '/redhat_access/insights/manage',
                     :url_hash => {:controller => :"redhat_access/telemetry_configurations", :action => :show},
                     :engine   => RedhatAccess::Engine
            rha_menu :top_menu,
                     :rhai_help,
                     :caption  => N_('Help'),
                     :url      => '/redhat_access/insights/help',
                     :url_hash => {:controller => :"redhat_access/analytics_dashboard", :action => :index},
                     :engine   => RedhatAccess::Engine
          end
        end
      end
    end

    config.to_prepare do
      ::Organization.send :include, RedhatAccess::Concerns::OrganizationExtensions
    end
  end
end
