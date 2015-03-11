RedhatAccess::Engine.routes.draw do



  scope '/proactive_support' do
    resources :strata_credentials
  end

  #API routes
  get 'configuration' => 'configuration#index'
  get 'logs' => 'logs#index'
  get 'attachments' => 'attachments#index'
  post 'attachments' => 'attachments#create'

  scope 'proactive_support/rs/telemetry' do
    get   '/api/branch_info', to: 'telemetry_api#get_branch_info'
    post  '/',                to: 'telemetry_api#proxy'
    match '/api/:path',       to: 'telemetry_api#proxy', :constraints => {:path => /.*/}
  end

  #Angular UI routes
  get 'log_viewer/index' => 'log_viewer#index'
  get 'cases/create'=> 'cases#create'
  get 'cases/index' => 'cases#index'
  get 'search/index' => 'search#index'
  get 'proactive_support', to: 'telemetry#index'
  get 'analytics_dashboard', to: 'analytics_dashboard#index'

  root :to => 'redhat_access#index'

end
