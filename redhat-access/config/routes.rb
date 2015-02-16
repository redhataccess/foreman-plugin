RedhatAccess::Engine.routes.draw do

  scope '/proactive_support' do
    resources :strata_credentials
  end

  #API routes
  get "configuration" => "configuration#index"
  get "logs" => "logs#index"
  get "attachments" => "attachments#index"
  post "attachments" => "attachments#create"

  scope "proactive_support/rs/telemetry" do
    get "/api/static/uploader.yaml", to: "telemetry_api#get_ph_conf"
    post "/", to: "telemetry_api#upload_sosreport"
    match '/api/*path', to: "telemetry_api#proxy"
  end

  #Angular UI routes
  get "log_viewer/index" => "log_viewer#index"
  get "cases/create"=> "cases#create"
  get "cases/index" => "cases#index"
  get "search/index" => "search#index"
  get "proactive_support", to: "telemetry#index"

  root :to => "redhat_access#index"

end
