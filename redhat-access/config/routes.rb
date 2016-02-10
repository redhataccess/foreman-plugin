RedhatAccess::Engine.routes.draw do

  #API routes
  get 'configuration' => 'configuration#index'
  get 'logs' => 'api/logs#index'
  get 'attachments' => 'api/attachments#index'
  post 'attachments' => 'api/attachments#create'





  unless  Foreman::Plugin.installed?('foreman_sam')
    scope '/' do
      resource :telemetry_configuration, only: [:show, :update]
    end
    scope '/r/insights' do
      get   '/',                    to: 'api/machine_telemetry_api#api_connection_test'
      get   '/v1/branch_info',      to: 'api/machine_telemetry_api#get_branch_info'
      post  '/uploads/(:id)',       to: 'api/machine_telemetry_api#proxy_upload'
      match '/view/api/me'   ,      to: 'api/telemetry_api#connection_status'
      match '/view/api/:path',      to: 'api/telemetry_api#proxy', :constraints => {:path => /.*/}
      match '/:path',               to: 'api/machine_telemetry_api#proxy', :constraints => {:path => /.*/}
    end
    get 'insights', to: 'analytics_dashboard#index'
    get 'analytics_configuration', to: 'telemetry_configuration#index'
    match '/insights/*path', to: 'analytics_dashboard#index'
  end

  scope '/strata' do
    match '/:path', to: 'api/strata_proxy#call', :constraints => {:path => /.*/}, via: [:get, :post, :delete,:put]
  end

  #Angular UI routes
  match '/:path',  to: 'redhat_access#index', :constraints => {:path => /.*/}, :via => [:get]
  root :to => 'redhat_access#index'

end
