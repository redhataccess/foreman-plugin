require 'test_helper'

module RedhatAccess
  class CasesControllerTest < ActionController::TestCase
    test "should get new" do
      get :new
      assert_response :success
    end
  
    test "should get list" do
      get :list
      assert_response :success
    end
  
  end
end
