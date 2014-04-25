require 'test_helper'

module RedhatAccess
  class ConfigurationControllerTest < ActionController::TestCase
    test "should get index" do
      get :index
      assert_response :success
    end
  
  end
end
