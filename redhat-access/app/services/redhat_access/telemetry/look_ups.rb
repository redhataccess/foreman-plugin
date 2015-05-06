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

      def use_basic_auth?
        REDHAT_ACCESS_CONFIG[:enable_telemetry_basic_auth]
      end

      def get_ssl_options_for_org(org ,ca_file)
        if org
          verify_peer = REDHAT_ACCESS_CONFIG[:telemetry_ssl_verify_peer] ? OpenSSL::SSL::VERIFY_PEER : OpenSSL::SSL::VERIFY_NONE
          ca_file = ca_file ? ca_file : get_default_ssl_ca_file
          if use_basic_auth?
            Rails.logger.debug("Using basic auth for portal communication")
            get_basic_auth_options(org, ca_file,verify_peer)
          else
            Rails.logger.debug("Using SSL auth for portal communication")
            get_mutual_tls_auth_options(org, ca_file,verify_peer)
          end
        else
          raise(RecordNotFound,'Organization not found or invalid')
        end
      end

      def get_default_ssl_ca_file
        #{}"#{RedhatAccess::Engine.root}/ca/rh_cert-api_chain.pem"
        nil
      end

      def get_mutual_tls_auth_options(org, ca_file, verify_peer)
        upstream = org.owner_details['upstreamConsumer']
        if !upstream || !upstream['idCert'] || !upstream['idCert']['cert'] || !upstream['idCert']['key']
          raise(RecordNotFound,'Unable to get portal SSL credentials. Missing org manifest?')
        else
          opts = {
            :ssl_client_cert => OpenSSL::X509::Certificate.new(upstream['idCert']['cert']),
            :ssl_client_key => OpenSSL::PKey::RSA.new(upstream['idCert']['key']),
            :ssl_ca_file => ca_file,
            :verify_ssl => verify_peer
          }
          Rails.logger.debug("Telemetry ssl options => ca_file:#{opts[:ssl_ca_file]} , peer verify #{opts[:verify_ssl]}")
          opts
        end
      end

      def get_basic_auth_options(org, ca_file, verify_peer )
        opts = {
          :user => org.telemetry_configuration.portal_user,
          :password => org.telemetry_configuration.portal_password,
          :ssl_ca_file => ca_file,
          :verify_ssl => verify_peer
        }
        opts
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
          hosts =  Katello::System.readable.where({:environment_id => environment_ids}).pluck(:uuid).compact.sort
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

      #TODO move version and name methods to generic utility
      def get_rha_plugin_name
        'redhat_access'
      end

      def get_rha_plugin_rpm_name
        'foreman-redhat_access'
      end

      def get_rha_plugin_version
        RedhatAccess::VERSION
      end

      def get_plugin_parent_name
        if defined? Satellite::VERSION
          return 'Satellite'
        end
        'Foreman'
      end

      def get_plugin_parent_version
        if defined? Satellite::VERSION
          return Satellite::VERSION
        end
        Foreman::Version.new.to_s
      end


    end
  end
end
