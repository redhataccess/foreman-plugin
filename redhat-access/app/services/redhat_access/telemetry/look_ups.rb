module RedhatAccess
  module Telemetry
    module LookUps
      class  RecordNotFound < StandardError
      end

      def can_unregister_system(user)
        # TODO: move this to an auth class?
        return false if user.nil?
        return true if user.admin
        permissions = user.cached_roles.collect(&:permissions).flatten.map!(&:name)
        # Rails.logger.debug("User can unregister telemetry hosts : #{ permissions.include?("rh_telemetry_configurations")}")
        # for now we allow all.
        true
      end

      def can_mask_rules(user)
        # TODO move this to an auth class?
        return false if user.nil?
        return true if user.admin
        permissions = user.cached_roles.collect(&:permissions).flatten.map!(&:name)
        Rails.logger.debug("User can mask telemetry hosts : #{permissions.include?("rh_telemetry_configurations")}")
        permissions.include?("rh_telemetry_configurations")
      end

      def is_susbcribed_to_redhat?(org)
        if org
          upstream = upstream_owner(org)
          return upstream && upstream['idCert'] ? true : false
        end
        false
      end

      def is_org_selected?
        Rails.logger.debug("Org selected ? #{current_organization_object.nil?}")
        current_organization_object.nil? ? false : true
      end

      def get_telemetry_config(org)
        TelemetryConfiguration.find_or_create_by(:organization_id => org.id) do |conf|
          conf.enable_telemetry = true
        end
      end

      def insights_api_host
        REDHAT_ACCESS_CONFIG[:telemetry_api_host]
      end

      def current_organization_object
        Organization.current || Organization.find_by_id(session[:organization_id]) if session[:organization_id]
      end

      def telemetry_enabled?(org)
        if org
          conf = get_telemetry_config(org)
          return conf.nil? ? false : conf.enable_telemetry
        else
          raise(RecordNotFound, 'Organization not found or invalid')
        end
      end

      def telemetry_enabled_for_uuid?(uuid)
        telemetry_enabled?(get_organization(uuid))
      end

      def disconnected_org?(org)
        if org
          # TODO: fix hard coding
          # disable insights if disconnected orgs aren't enabled and katello doesn't point to redhat's CDN
          !REDHAT_ACCESS_CONFIG[:enable_insights_for_disconnected_orgs] && org.redhat_repository_url != 'https://cdn.redhat.com'
        else
          raise(RecordNotFound, 'Organization not found or invalid')
        end
      end

      def get_leaf_id(uuid)
        system = get_content_host(uuid)
        if system.nil?
          Rails.logger.debug('Host not found or invalid')
          raise(RecordNotFound, 'Host not found or invalid')
        end
        uuid
      end

      def get_branch_id_for_org(org)
        if org
          owner = upstream_owner(org)
          if !owner['uuid']
            # ldebug('Org manifest not found or invalid in get_branch_id')
            raise(RecordNotFound, 'Branch ID not found for organization')
          else
            branch_id =  owner['uuid']
          end
        else
          raise(RecordNotFound, 'Organization not found or invalid')
        end
      end

      def get_ssl_options_for_uuid(uuid, ca_file)
        org = get_organization(uuid)
        get_ssl_options_for_org(org, ca_file)
      end

      def use_basic_auth?
        REDHAT_ACCESS_CONFIG[:enable_telemetry_basic_auth]
      end

      def get_ssl_options_for_org(org, ca_file)
        if org
          verify_peer = REDHAT_ACCESS_CONFIG[:telemetry_ssl_verify_peer] ? OpenSSL::SSL::VERIFY_PEER : OpenSSL::SSL::VERIFY_NONE
          ssl_version = REDHAT_ACCESS_CONFIG[:telemetry_ssl_version] ? REDHAT_ACCESS_CONFIG[:telemetry_ssl_version] : nil
          ca_file = ca_file ? ca_file : get_default_ssl_ca_file
          Rails.logger.debug("Verify peer #{verify_peer}")
          if use_basic_auth?
            Rails.logger.debug("Using basic auth for portal communication")
            get_basic_auth_options(org, ca_file, verify_peer, ssl_version)
          else
            Rails.logger.debug("Using SSL auth for portal communication")
            get_mutual_tls_auth_options(org, ca_file, verify_peer, ssl_version)
          end
        else
          raise(RecordNotFound, 'Organization not found or invalid')
        end
      end

      def get_default_ssl_ca_file
        "#{RedhatAccess::Engine.root}/ca/rh_cert-api_chain.pem"
      end

      def get_mutual_tls_auth_options(org, ca_file, verify_peer, ssl_version)
        upstream = upstream_owner(org)
        if !upstream || !upstream['idCert'] || !upstream['idCert']['cert'] || !upstream['idCert']['key']
          raise(RecordNotFound, 'Unable to get portal SSL credentials. Missing org manifest?')
        else
          opts = {
            :ssl_client_cert => OpenSSL::X509::Certificate.new(upstream['idCert']['cert']),
            :ssl_client_key  => OpenSSL::PKey::RSA.new(upstream['idCert']['key']),
            :ssl_ca_file     => ca_file,
            :verify_ssl      => verify_peer
          }
          opts[:ssl_version] = ssl_version if ssl_version
          Rails.logger.debug("Telemetry ssl options => ca_file:#{opts[:ssl_ca_file]} , peer verify #{opts[:verify_ssl]}")
          opts
        end
      end

      def upstream_owner(org)
        #We use a cache because owner_details is networkcall to Candlepin
        #We make a lot of these calls each time the UI is accessed
        Rails.cache.fetch("insights_upstream_owner-#{org.id}", expires_in: 1.minute) do
          org.owner_details['upstreamConsumer']
        end
      end

      def get_basic_auth_options(org, ca_file, verify_peer, ssl_version)
        opts = {
          :user        => org.telemetry_configuration.portal_user,
          :password    => org.telemetry_configuration.portal_password,
          :ssl_ca_file => ca_file,
          :verify_ssl  => verify_peer
        }
        opts[:ssl_version] = ssl_version if ssl_version
        opts
      end

      def get_branch_id_for_uuid(uuid)
        org = get_organization(uuid)
        get_branch_id_for_org org
      end

      def get_organization(uuid_or_host)
        # this takes either a host object or a uuid string
        if uuid_or_host.is_a?(::Host::Managed)
          return uuid_or_host.nil? ? nil : uuid_or_host.organization
        end

        system = get_content_host(uuid_or_host)
        system.nil? ? nil : system.organization
      end

      def get_content_host(uuid = nil)
        uuid ||= params[:id]
        facet = Katello::Host::SubscriptionFacet.where(:uuid => uuid).first
        if facet.nil?
          User.as_anonymous_admin { Katello::Resources::Candlepin::Consumer.get(uuid) }
          return nil
        end
        ::Host::Managed.unscoped.find(facet.host_id)
      end

      def get_content_hosts(org)
        if org
          ::Host::Managed.authorized('view_hosts', ::Host::Managed).joins(:subscription_facet).rewhere({:organization_id => org.id}).pluck("katello_subscription_facets.uuid")
        else
          raise(RecordNotFound, 'Organization not found or invalid')
        end
      end

      def get_portal_http_proxy
        begin
          @http_proxy_string ||=
              begin
                proxy_uri = URI('')

                if Setting[:content_default_http_proxy].present?
                  proxy_config = HttpProxy.default_global_content_proxy
                  proxy_uri = URI(proxy_config&.url)
                  if proxy_config&.username.present?
                    proxy_uri.user = CGI.escape(proxy_config&.username)
                    if proxy_config&.password.present?
                      proxy_uri.password = CGI.escape(proxy_config&.password)
                    end
                  end
                end

                if proxy_uri.to_s.blank?
                  if SETTINGS[:katello][:cdn_proxy] && SETTINGS[:katello][:cdn_proxy][:host]
                    proxy_config = SETTINGS[:katello][:cdn_proxy]
                    proxy_uri.scheme = URI.parse(proxy_config[:host]).scheme
                    proxy_uri.host = URI.parse(proxy_config[:host]).host
                    proxy_uri.port = proxy_config[:port] if proxy_config[:port]
                    if proxy_config[:user].present?
                      proxy_uri.user =  CGI.escape(proxy_config[:user]) if proxy_config[:user]
                      if proxy_config[:password].present?
                        proxy_uri.password = CGI.escape(proxy_config[:password])
                      end
                    end
                  end
                end

                # Ruby's uri parser doesn't handle encoded characters so Katello added two new schemes to handle proxy
                # passwords.  See https://github.com/Katello/katello/blob/master/app/lib/katello/util/proxy_uri.rb
                proxy_uri.scheme = 'proxy' if proxy_uri.scheme == 'http'
                proxy_uri.scheme = 'proxys' if proxy_uri.scheme == 'https'

                proxy_uri.to_s
              end

          Rails.logger.debug("Insights proxy url = #{@http_proxy_string}")
          @http_proxy_string
        rescue
          Rails.logger.debug("insights plugin: Something bad happened trying to get the proxy url")
          raise
        end
      end

      def get_http_user_agent
        "#{get_plugin_parent_name}/#{get_plugin_parent_version};#{get_rha_plugin_name}/#{get_rha_plugin_version}"
      end

      def get_http_options(include_user_id = false)
        headers = {}
        if include_user_id && User.current
          headers = {:INSIGHTS_USER_ID => user_login_to_hash(User.current.login)}
        end
        {:logger => Rails.logger,
         :http_proxy => get_portal_http_proxy,
         :user_agent => get_http_user_agent,
         :headers => headers}
      end

      # global use_subsets flag - defaults to false to suppress use of subsets to address scalability problems
      # (subset and branch_id are equivalent for satellite)
      def use_subsets?
        REDHAT_ACCESS_CONFIG[:use_subsets] || false
      end

      # timeout for telemetry api operations
      def get_tapi_timeout
        REDHAT_ACCESS_CONFIG[:telemetry_api_timeout_s] || 60
      end

      # timeout for telemetry uploads
      def get_upload_timeout
        REDHAT_ACCESS_CONFIG[:telemetry_upload_timeout_s] || 120
      end

      def user_login_to_hash(login)
        Digest::SHA1.hexdigest(login)
      end

      # TODO: move version and name methods to generic utility
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
        if defined? ForemanThemeSatellite::SATELLITE_VERSION
          return 'Satellite'
        end
        'Foreman'
      end

      def get_plugin_parent_version
        if defined? ForemanThemeSatellite::SATELLITE_VERSION
          return ForemanThemeSatellite::SATELLITE_VERSION.gsub(/[a-zA-Z ]/, "")
        end
        Foreman::Version.new.to_s
      end
    end
  end
end
