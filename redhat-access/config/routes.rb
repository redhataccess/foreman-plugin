RedhatAccess::Engine.routes.draw do

  get "log_viewer/index"

  get "log_viewer/GetMachineList"

  get "log_viewer/GetFileList"

  get "log_viewer/GetLogFile"

  get "cases/new"

  get "cases/list"

  get "search/index"
  get "redhat_access/index"
  
  root :to => 'redhat_access#index' 
end
