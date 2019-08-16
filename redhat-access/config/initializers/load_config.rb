if File.exists? ("#{RedhatAccess::Engine.root}/config/config.yml")
  REDHAT_ACCESS_CONFIG = YAML.load_file("#{RedhatAccess::Engine.root}/config/config.yml")
elsif File.exists? ('/etc/redhat_access/config.yml')
  REDHAT_ACCESS_CONFIG = YAML.load_file('/etc/redhat_access/config.yml')
else 
  REDHAT_ACCESS_CONFIG = YAML.load_file("#{RedhatAccess::Engine.root}/config/defaults.yml")
end
