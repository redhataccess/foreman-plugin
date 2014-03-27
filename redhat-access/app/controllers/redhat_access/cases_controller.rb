require_dependency "redhat_access/application_controller"

module RedhatAccess
  class CasesController < ApplicationController
    def new
    	 redirect_to '/redhat_access/#/case/new'
    end
  
    def list
    	 redirect_to '/redhat_access/#/case/new'
    end
  end
end
