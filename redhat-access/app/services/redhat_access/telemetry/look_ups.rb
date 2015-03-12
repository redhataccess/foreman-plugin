module RedhatAccess
  module Telemetry
    module LookUps

      class  RecordNotFound < StandardError
      end

      # Returns an array of the machine IDs that this user has access to
      def get_machines
        hosts = resource_base.search_for('').map(&:name)
        #hopefully we can refactor later to optimize
        hosts = hosts.map  do |i|
          host = get_content_host_by_fqdn(i)
          host.nil? ? nil : host.uuid
        end
        hosts.compact.sort
      end

      def resource_base
        @resource_base ||= Host.authorized(current_permission, Host)
      end

      def get_content_host_by_fqdn(name)
        Katello::System.first(:conditions => { :name => name})
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
            ldebug('Org manifest not found or invalid in get_branch_id')
            raise(RecordNotFound,'Branch ID not found for organization')
          else
            branch_id =  org.owner_details['upstreamConsumer']['uuid']
          end
        else
          ldebug('Org not found or invalid in get_branch_id')
          raise(RecordNotFound,'Organization not found or invalid')
        end
      end

      def get_ssl_options_for_uuid(uuid)
        org = get_organization(uuid)
        get_ssl_options_for_org org
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
              :ssl_ca_file => ca_file,
              :verify_ssl => ca_file ? OpenSSL::SSL::VERIFY_PEER : OpenSSL::SSL::VERIFY_NONE,
            }
          end
        else
          raise(RecordNotFound,'Organization not found or invalid')
        end
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

    end
  end
end
