require_dependency "redhat_access/application_controller"

module RedhatAccess
  class CasesController < ApplicationController
    def create
      redirect_to '/redhat_access/#/case/new'
    end

    def index
      redirect_to '/redhat_access/#/case/list'
    end

  end
end
