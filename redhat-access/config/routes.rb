RedhatAccess::Engine.routes.draw do

  get "search/index"
  get "redhat_access/index"
  
  root :to => 'redhat_access#index' 
end
