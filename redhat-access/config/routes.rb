RedhatAccess::Engine.routes.draw do

  get  'proactive_support', to: 'telemetry_api#index'

  get  'proactive_support/rs/telemetry/api/static/uploader.yml', to: 'telemetry_api#get_ph_conf'
  post 'proactive_support/rs/telemetry', to: 'telemetry_api#upload_sosreport'

  #API routes
  get "configuration" => "configuration#index"
  get "logs" => "logs#index"
  get "attachments" => "attachments#index"
  post "attachments" => "attachments#create"


  #Angular UI routes
  get "log_viewer/index" => "log_viewer#index"
  get "cases/create"=> "cases#create"
  get "cases/index" => "cases#index"
  get "search/index" => "search#index"

  root :to => "redhat_access#index"

end
