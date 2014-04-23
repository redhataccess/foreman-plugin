require 'redhat_support_lib'
require 'base64'
module RedhatAccess::Strata
  class Client
    attr_reader :api
    def initialize(authToken)
      #TODO should we reject here if token is invalid?
      username = ""
      password = ""
      unless token.nil?
        token = Base64.decode64(token)
        username,password = token.split(":")
      end
      config = RedHatSupportLib::Network::Config.new
      config.base_uri = 'https://' + REDHAT_ACCESS_CONFIG[:strata_host]
      config.username= username
      config.password = password
      config.proxy_host= REDHAT_ACCESS_CONFIG[:proxy_host]
      config.proxy_port = REDHAT_ACCESS_CONFIG[:strata_host]
      config.proxy_user= REDHAT_ACCESS_CONFIG[:proxy_user]
      config.proxy_password= REDHAT_ACCESS_CONFIG[:proxy_password ]
      # config.log_location = '/home/some_user/code/logs/restclient/support_lib.txt'
      attachments_config = {:max_http_size => REDHAT_ACCESS_CONFIG[:attachment_max_http_size],
                            :ftp_host => REDHAT_ACCESS_CONFIG[:attachment_ftp_host],
                            :ftp_remote_dir => REDHAT_ACCESS_CONFIG[:attachment_ftp_dir]}
      @api = RedHatSupportLib::Api::API.new(config,attachments_config)
    end
  end
end
