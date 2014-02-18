require 'test_helper'

module RedhatAccess
  class ArticlesControllerTest < ActionController::TestCase
    test "should get index" do
      get :index
      assert_response :success
    end
  
  end
end
