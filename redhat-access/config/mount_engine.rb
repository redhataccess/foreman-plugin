Foreman::Application.routes.draw do
  mount RedhatAccess::Engine, :at => "/redhat_access", :as => 'redhat_access'
end