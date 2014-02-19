RedhatAccess::Engine.routes.draw do

  get "cases/create"

  get "cases/search"

  get "articles/index"
  
  match 'cases/create' => 'articles#index', :via => :get
  match 'cases/search' => 'articles#index', :via => :get
  match 'articles' => 'articles#index', :via => :get

  root :to => 'angular#index' 
end
