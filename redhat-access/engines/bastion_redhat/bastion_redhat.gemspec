$LOAD_PATH.push File.expand_path("../lib", __FILE__)

# Maintain your gem's version:
require "bastion_redhat/version"

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = "bastion_redhat"
  s.version     = BastionRedhat::VERSION
  s.authors     = [""]
  s.email       = [""]
  s.homepage    = ""
  s.summary     = ""
  s.description = ""

  s.files = Dir["{app,config,lib}/**/*"] + ["README"]
  s.test_files = Dir["test/**/*"]

  s.add_dependency "bastion", ">= 3.2.0", "< 4.0.0"
end
