require_dependency "redhat_access/application_controller"
require_dependency "redhat_access/strata/client"
require_dependency "redhat_access/sos_reports/generator"

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
