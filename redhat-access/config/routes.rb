RedhatAccess::Engine.routes.draw do


  #API routes
  get "logs" => 'logs#index'
  get "attachments" => "attachments#index"
  post '/cases/:case_number/attachments/' => 'cases#attachments'


  #Angular UI routes
  get "log_viewer/index" => 'log_viewer#index'
  get "cases/create"=> 'cases#create'
  get "cases/index" => 'cases#index'
  get "search/index" => 'search#index'



  root :to => 'redhat_access#index'
end
