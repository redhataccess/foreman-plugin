require 'redhat_access_lib'

module RedhatAccess
  module Telemetry
    class MessagingService

      include RedhatAccess::Telemetry::LookUps

      def initialize(org)
        @org = org
        @user_map = current_user_map
        @branch_id = get_branch_id_for_org(org)
      end

      def all_messages
        User.as :admin do |user|
          [
              {:user => User.current,
               :body => "Hello #{Time.new}",
               :subject => "Test"
              }
          ]
        end
        # messages = []
        # current_user_map.each do |key,user|
        #   begin
        #     user_msgs = messages_for(user.login)
        #     messages[:user.login] = user_msgs unless user_msgs.nil?
        #   rescue => e
        #     message = _('Unable to send insights e-mail notification: %{error}' % {:error => e})
        #     Rails.logger.error(message)
        #     #output[:result] = message
        #   end
        # end
      end

      def get_machines
        machines = get_content_hosts(@org)
        if machines.empty?
          machines = ['NULL_SET']
        end
        machines
      end

      def get_current_organization
        @org
      end

      def get_auth_opts(creds)
        get_ssl_options_for_org(@org, nil)
      end


      private

      def current_user_map
        map = {}
        users = ::User.select do |user|
          user.receives?(:insights_notifications) && user.mail_enabled? && user.allowed_organizations.include?(@org)
        end
        users.each do |user|
          map[user_login_to_hash(user.login)] = user.login
        end
        map
      end

      def messages_for(username)
        User.as username do |user|
          if user.nil? || user.email.nil? || !user.receives?(:insights_notifications)
            return nil
          end
          options = {:method => :GET,
                     :resource => 'r/insights/v2/messaging',
                     :params => {},
                     :payload => nil,
                     :use_subsets => true
          }
          http_request(options, true)
        end
      end

      def user_hash_to_login(user_hash)
        @user_map[user_hash]
      end

      def http_request(options, add_user_header=false)
        unless options[:params]
          options[:params] = {}
        end
        res = new_api_client(add_user_header).call_tapi(options[:method],
                                                        URI.escape(options[:resource]),
                                                        {:branch_id => @branch_id}.merge(options[:params]),
                                                        options[:payload],
                                                        options[:use_subsets])
        resp_data = res[:data]
        if res[:code] == 401
          res[:code] = 502
          resp_data = {
              :message => 'Authentication to the Insights Service failed.',
              :headers => {}
          }
        end
        resp_data
      end

      def new_api_client(add_user_header)
        options = get_http_options(add_user_header)
        RedhatAccess::Telemetry::PortalClient.new(get_creds,
                                                  self,
                                                  options)
      end
    end
  end
end
