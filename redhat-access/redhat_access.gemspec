$:.push File.expand_path("../lib", __FILE__)

# Maintain your gem's version:
require "redhat_access/version"

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = "redhat_access"
  s.version     = RedhatAccess::VERSION
  s.authors     = ["Lindani Phiri"]
  s.email       = ["lphiri@redhat.com"]
  s.homepage    = "http://www.lphiri.redhat.com"
  s.summary     = "Plugin to add Redhat Access to Foreman"
  s.description = "Plugin adds knowledge base search, case management and diagnostics to Foreman"


  s.files = Dir["{app,config,db,lib,vendor,public,script,locale}/**/*"] + ["LICENSE.txt", "Rakefile", "README.rdoc", "redhat_access.gemspec", "Gemfile"]
  s.test_files = Dir["test/**/*"]

  s.add_dependency "rails", "~> 3.2"
  #s.add_dependency "redhat_access_lib" , ">=0.0.1" 
  #s.add_dependency "haml-rails"
  #s.add_dependency "requirejs-rails"
  #-------------s.add_dependency "bootstrap-sass", "~> 3.0.3.0"
  # s.add_dependency "jquery-rails"
  #-------------s.add_dependency "angular-rails-templates", ">= 0.0.4"
  s.add_development_dependency "sqlite3"
  #s.add_development_dependency "redhat_access_lib"
end
