require_dependency "redhat_access/application_controller"

module RedhatAccess
  class RedhatAccessController < RedhatAccess::ApplicationController
    def index
      require_admin if params[:path] == "logviewer"
    end
  end
end
