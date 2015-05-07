require 'spec_helper'
describe 'access_insights_client' do

  context 'with defaults for all parameters' do
    it { should contain_class('access_insights_client') }
  end
end
