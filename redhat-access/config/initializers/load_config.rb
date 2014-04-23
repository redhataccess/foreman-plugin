if File.exists? ("#{RedhatAccess::Engine.root}/config/config.yml")
  REDHAT_ACCESS_CONFIG = YAML.load_file("#{RedhatAccess::Engine.root}/config/config.yml")
elsif File.exists? ('/etc/redhat_acces/config.yml')
  REDHAT_ACCESS_CONFIG = YAML.load_file('/etc/redhat_acces/config.yml')
end
