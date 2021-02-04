RedhatAccess::Engine.routes.draw do

  #API routes
  get 'configuration' => 'configuration#index'
  get 'logs' => 'api/logs#logs'
  get 'attachments' => 'api/attachments#index'
  post 'attachments' => 'api/attachments#create'

  unless  Foreman::Plugin.installed?('foreman_sam')
    scope '/' do
      resource :telemetry_configuration, only: [:show, :update]
    end
    get "/insights/templates/:page" => "analytics_dashboard#template"  # hack to get around angular-rails-templates bug
    scope '/r/insights' do
      get   '/',                    to: 'api/machine_telemetry_api#api_connection_test'
      post  '/uploads/(:id)',       to: 'api/machine_telemetry_api#proxy_upload'
      get '/view/api/:v/me' ,   to: 'api/telemetry_api#connection_status', :constraints => {:v =>/(v[0-9]|latest)/}
      match '/view/api/:path',      to: 'api/telemetry_api#proxy', :constraints => {:path => /.*/} ,via: [:get, :post, :delete,:put, :patch]
    end
    get 'insights', to: 'analytics_dashboard#index'
    get 'analytics_configuration', to: 'telemetry_configuration#index'
    match '/insights/*path', to: 'analytics_dashboard#index', via: [:get]
  end

  scope '/strata' do
    match '/:path', to: 'api/strata_proxy#call', :constraints => {:path => /.*/}, via: [:get, :post, :delete,:put]
  end

  #Angular UI routes

  match '/:path',  to: 'redhat_access#index', :constraints => {:path => /.*/}, :via => [:get]
  root :to => 'redhat_access#index'

end
