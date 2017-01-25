require 'redhat_access_lib'
require 'ostruct'

module RedhatAccess
  module Telemetry
    class MessagingService

      include RedhatAccess::Telemetry::LookUps

      WEEKLY_SUMMARY_PATH = 'v1/messaging/data/weeklyinfo'

      def initialize(org)
        @org = org
        @user_map = current_user_map
        @branch_id = get_branch_id_for_org(org)
      end


      def all_weekly_mail_data
        data = []
        current_user_map.each do |key,user|
          begin
            user_data = weekly_summary_data(user.login)
            data.push(user_data) unless user_data.nil? || user_data[:data].nil? || user_data[:data].total_systems == 0
          rescue => e
            Rails.logger.warn("Unable to get weekly email data for user")
          end
        end
        data
      end

      def weekly_summary_data(username)
        User.as username do
          options = {:method => :GET,
                     :resource => WEEKLY_SUMMARY_PATH,
                     :params => {},
                     :payload => nil,
                     :use_subsets => true
          }
          json_data = http_request(options, true)
          # Sample expected output: {
          #     "total_systems": 43,
          #     "checking_in_pct": 2,
          #     "total_actions": 22,
          #     "high_severity_hits": 11,
          #     "new_rules": [
          #         {
          #             "rule_id": "vfs_cache_pressure|VFS_CACHE_PRESSURE_TOO_HIGH",
          #             "summary": Rule summary,
          #             "description": "VFS cache pressue"
          #         }
          #     ]
          # }
          data = JSON.parse(json_data, object_class: OpenStruct)
          info = {
              user: User.current,
              data: data
          }
          info
        end
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

      def get_creds
        #legacy
        nil
      end



      private

      def current_user_map
        map = {}
        users = ::User.select do |user|
          user.receives?(:insights_notifications) && user.mail_enabled? && user.allowed_organizations.include?(@org)
        end
        users.each do |user|
          map[user_login_to_hash(user.login)] = user
        end
        map
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
                                                        #{:branch_id => @branch_id}.merge(options[:params]),
                                                        options[:params],
                                                        options[:payload],
                                                        nil,
                                                        options[:use_subsets])
        resp_data = res[:data]
        if res[:code] != 200
            raise "Unable to read data code #{res[:code]}"
        end
        resp_data
      end

      def new_api_client(add_user_header)
        options = get_http_options(add_user_header)
        RedhatAccess::Telemetry::PortalClient.new(nil,
                                                  nil,
                                                  get_creds,
                                                  self,
                                                  options)
      end
    end
  end
end
