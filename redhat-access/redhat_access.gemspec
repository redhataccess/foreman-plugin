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
  s.description = "This plugin adds Red Hat Access knowledge base search, case management and diagnostics to Foreman"

  s.files = Dir["{app,config,db,lib,vendor,public,script,ca,locale}/**/*"] + ["LICENSE.txt", "Rakefile", "README.rdoc", "redhat_access.gemspec", "Gemfile"]
  s.test_files = Dir["test/**/*"]
  s.add_dependency "redhat_access_lib" , ">=1.0.1"
  s.add_dependency "angular-rails-templates", ">=0.0.4"

end
