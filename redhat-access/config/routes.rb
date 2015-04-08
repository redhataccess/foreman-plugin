RedhatAccess::Engine.routes.draw do



  scope '/proactive_support' do
    resources :strata_credentials
  end

  scope '/' do
    resource :telemetry_configuration, only: [:show, :update]
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
  get 'logviewer', to: 'redhat_access#index'
  get 'case/new', to: 'redhat_access#index'
  get 'case/list', to: 'redhat_access#index'
  get 'search', to: 'redhat_access#index'

  get 'proactive_support', to: 'telemetry#index'
  get 'analytics_dashboard', to: 'analytics_dashboard#index'
  get 'analytics_configuration', to: 'telemetry_configuration#index'
  match '/analytics_dashboard/*path', to: 'analytics_dashboard#index'

  root :to => 'redhat_access#index'

end
