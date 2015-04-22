module RedhatAccess
  module Telemetry
    module LookUps

      class  RecordNotFound < StandardError
      end

      def telemetry_enabled?(org)
        if org
          conf = org.telemetry_configuration
          return conf.nil? ? false : conf.enable_telemetry
        else
          raise(RecordNotFound,'Host not found or invalid')
        end
      end

      def telemetry_enabled_for_uuid?(uuid)
        telemetry_enabled?(get_organization(uuid))
      end

      def get_content_host_by_fqdn(name)
        Katello::System.first(:conditions => { :name => name})
      end

      def disconnected_org?(org)
        if org
          org.redhat_repository_url != 'https://cdn.redhat.com'
        else
          raise(RecordNotFound,'Organization not found or invalid')
        end
      end

      def get_leaf_id(uuid)
        system = get_content_host(uuid)
        if system.nil?
          ldebug('Host not found or invalid')
          raise(RecordNotFound,'Host not found or invalid')
        end
        uuid
      end

      def get_branch_id_for_org(org)
        if org
          if !org.owner_details['upstreamConsumer'] || !org.owner_details['upstreamConsumer']['uuid']
            #ldebug('Org manifest not found or invalid in get_branch_id')
            raise(RecordNotFound,'Branch ID not found for organization')
          else
            branch_id =  org.owner_details['upstreamConsumer']['uuid']
          end
        else
          #ldebug('Org not found or invalid in get_branch_id')
          get_organization(uuid)
        end
      end

      def get_ssl_options_for_uuid(uuid, ca_file)
        org = get_organization(uuid)
        get_ssl_options_for_org(org,ca_file)
      end

      def get_ssl_options_for_org(org ,ca_file)
        if org
          upstream = org.owner_details['upstreamConsumer']
          if !upstream || !upstream['idCert'] || !upstream['idCert']['cert'] || !upstream['idCert']['key']
            raise(RecordNotFound,'Unable to get portal SSL credentials. Missing org manifest?')
          else
            opts = {
              :ssl_client_cert => OpenSSL::X509::Certificate.new(upstream['idCert']['cert']),
              :ssl_client_key => OpenSSL::PKey::RSA.new(upstream['idCert']['key']),
              :ssl_ca_file => ca_file ? ca_file : get_default_ssl_ca_file ,
              :verify_ssl => ca_file ? OpenSSL::SSL::VERIFY_PEER : OpenSSL::SSL::VERIFY_NONE,
            }
            return opts
          end
        else
          raise(RecordNotFound,'Organization not found or invalid')
        end
      end

      def get_default_ssl_ca_file
        #TODO implementing default pinning
        nil
      end

      def basic_auth_options_for_uuid(uuid)
        #TODO
      end

      def basic_auth_options_for_org(org)
        #TODO
      end

      def get_branch_id_for_uuid(uuid)
        org = get_organization(uuid)
        get_branch_id_for_org org
      end

      def get_organization(uuid)
        system = get_content_host(uuid)
        system.nil? ? nil : Organization.find(system.environment.organization_id)
      end

      def get_content_host(uuid)
        system = Katello::System.first(:conditions => { :uuid => uuid })
      end

      def get_content_hosts(org)

        if org
          org_id = org.id
          environment_ids = Organization.find(org_id).kt_environments.pluck(:id)
          hosts =  Katello::System.where("environment_id = ?", environment_ids).pluck(:uuid).compact.sort
        else
          raise(RecordNotFound,'Organization not found or invalid')
        end
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
end
