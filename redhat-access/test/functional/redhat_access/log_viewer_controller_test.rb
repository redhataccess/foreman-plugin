require 'test_helper'

module RedhatAccess
  class LogViewerControllerTest < ActionController::TestCase
    test "should get index" do
      get :index
      assert_response :success
    end
  
  end
end
