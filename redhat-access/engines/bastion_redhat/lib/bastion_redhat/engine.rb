module BastionRedhat
  class Engine < ::Rails::Engine
    isolate_namespace BastionRedhat

    initializer 'bastion.assets_dispatcher', :before => :build_middleware_stack do |app|
      app.middleware.use ::ActionDispatch::Static, "#{BastionRedhat::Engine.root}/app/assets/javascripts/bastion_redhat"
    end

    config.to_prepare do
      Bastion.register_plugin(
        :name => 'bastion_redhat',
        :javascript => 'bastion_redhat/bastion_redhat',
        :stylesheet => 'bastion_redhat/bastion_redhat',
        :pages => %w(
          insights
        )
      )
    end
  end
end
