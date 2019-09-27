require 'redhat_access_lib'
require 'base64'
module RedhatAccess::Strata
  class Client
    include Katello::Util::HttpProxy
    attr_reader :api
    def initialize(token)
      username = ""
      password = ""
      unless token.nil?
        token = Base64.decode64(token)
        username,password = token.split(":")
      end
      config = RedHatSupportLib::Network::Config.new
      config.base_uri = 'https://api.' + REDHAT_ACCESS_CONFIG[:strata_host]
      config.username= username
      config.password = password
      config.proxy = get_portal_http_proxy
      attachments_config = {:max_http_size => REDHAT_ACCESS_CONFIG[:attachment_max_http_size],
                            :ftp_host => REDHAT_ACCESS_CONFIG[:attachment_ftp_host],
                            :ftp_remote_dir => REDHAT_ACCESS_CONFIG[:attachment_ftp_dir]}
      @api = RedHatSupportLib::Api::API.new(config,attachments_config)
    end

    def get_portal_http_proxy
      # switching to Katello::Util::HttpProxy's proxy_uri, which has a workaround for rest-client's poor handling
      # of special characters in proxy passwords (see https://github.com/Katello/katello/commit/bea53437509f68ceeff0eabfde88f69810876307)
      proxy_uri
    end
  end
end
