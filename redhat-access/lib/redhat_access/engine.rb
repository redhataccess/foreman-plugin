require "requirejs-rails"

module RedhatAccess
  class Engine < ::Rails::Engine
    isolate_namespace RedhatAccess

    initializer 'redhat_access.mount_engine', :after => :build_middleware_stack do |app|
      app.routes_reloader.paths << "#{RedhatAccess::Engine.root}/config/mount_engine.rb"
    end

    initializer :register_assets do |app|
      if Rails.env.production?
        assets = YAML.load_file("#{RedhatAccess::Engine.root}/public/assets/manifest.yml")

        assets.each_pair do |file, digest|
          app.config.assets.digests[file] = digest
        end
      end
    end

    initializer 'redhat_access.register_plugin', :after=> :finisher_hook do |app|
      Foreman::Plugin.register :redhat_access do
        # The following optional sections can be added here:
        # require foreman version section
        # permission section
        # roles section
        # menu section
        #sub_menu :header_menu, :access, :url_hash => {:controller=> :hosts, :action=>:new},
        #  :caption=> N_('Redhat Access'),
        #  :after =>:user_menu
        #end
        # end
        # menu :top_menu, :new_host, :url_hash => {:controller=> :hosts, :action=>:new},
        #   :caption=> N_('Redhat Access')
        # sub_menu :header_menu, :another_menu, :caption=> N_('Another Menu') do
        #   menu :header_menu, :Search, :url_hash => {:controller=> :hosts, :action=>:index}
        #   menu :header_menu, :Cases, :url_hash => {:controller=> :hosts, :action=>:index}
        # end

        # sub_menu :header_menu, :another_menu2, :caption=> N_('Another Menu2') do
        #   menu :header_menu, :Search, :url_hash => {:controller=> :hosts, :action=>:index}
        #   menu :header_menu, :Cases, :url_hash => {:controller=> :hosts, :action=>:index}
        # end
        requires_foreman '> 1.4'
        sub_menu :header_menu, :redhat_access_menu, :caption=> N_('Redhat Access') do
          menu :header_menu,
            :Search,
            :url_hash => {:controller=> :"redhat_access/articles",
                          :action=> :index},
            :engine => RedhatAccess::Engine
          sub_menu :header_menu, :support_cases, :caption=> N_('Support Cases') do
            menu :header_menu, :view_cases, :caption=> N_('View'),
              :url_hash => {:controller=> :"redhat_access/cases", :action=>:search},
              :engine => RedhatAccess::Engine
            menu :header_menu, :new_cases, :caption=> N_('New'),
              :url_hash => {:controller=> :"redhat_access/cases", :action=>:create},
              :engine => RedhatAccess::Engine
          end
        end

      end
    end
  end
end
