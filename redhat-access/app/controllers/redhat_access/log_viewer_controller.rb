require_dependency "redhat_access/application_controller"

module RedhatAccess
  class LogViewerController < ApplicationController
    def index
      require_admin
      redirect_to '/redhat_access/#/logviewer'
    end
  end
end
