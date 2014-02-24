require_dependency "redhat_access/application_controller"

module RedhatAccess
  class SearchController < ApplicationController
    def index
      redirect_to '/redhat_access/#/redhat_access/search'
    end
  end
end
