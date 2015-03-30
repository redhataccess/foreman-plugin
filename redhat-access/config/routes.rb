RedhatAccess::Engine.routes.draw do



  scope '/proactive_support' do
    resources :strata_credentials
  end

  scope '/' do
    resources :telemetry_configuration
  end



  #API routes
  get 'configuration' => 'configuration#index'
  get 'logs' => 'logs#index'
  get 'attachments' => 'attachments#index'
  post 'attachments' => 'attachments#create'

  scope '/rs/telemetry' do
    get   '/api/v1/branch_info',  to: 'machine_telemetry_api#get_branch_info'
    post  '/',                    to: 'machine_telemetry_api#proxy_upload'
    match '/api/:path',           to: 'machine_telemetry_api#proxy', :constraints => {:path => /.*/}
    match '/view/api/:path',      to: 'telemetry_api#proxy', :constraints => {:path => /.*/}
  end

  #Angular UI routes
  get 'log_viewer/index' => 'log_viewer#index'
  get 'cases/create'=> 'cases#create'
  get 'cases/index' => 'cases#index'
  get 'search/index' => 'search#index'
  get 'proactive_support', to: 'telemetry#index'
  get 'analytics_dashboard', to: 'analytics_dashboard#index'
  get 'analytics_configuration', to: 'telemetry_configuration#index'

  root :to => 'redhat_access#index'

end
