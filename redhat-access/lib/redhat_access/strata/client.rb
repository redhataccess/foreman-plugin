require 'redhat_access_lib'
require 'base64'
module RedhatAccess::Strata
  class Client
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
      proxy = nil
      if Katello.config.cdn_proxy && Katello.config.cdn_proxy.host
        proxy_config = Katello.config.cdn_proxy
        uri = URI('')
        uri.scheme = URI.parse(proxy_config.host).scheme
        uri.host = URI.parse(proxy_config.host).host
        uri.port = proxy_config.port
        uri.user = proxy_config.user
        uri.password = proxy_config.password
        proxy = uri.to_s
      end
      return proxy
    end
  end
end
