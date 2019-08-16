require 'redhat_access_lib'
require 'ostruct'

module RedhatAccess
  module Telemetry
    class MessagingService

      include RedhatAccess::Telemetry::LookUps

      WEEKLY_SUMMARY_PATH = 'v1/messaging/data/weeklyinfo'
      RULE_STATS_PATH = 'v3/stats/rules'
      SYSTEM_STATS_PATH = 'v3/stats/systems'

      def initialize(org)
        @org = org
        @branch_id = get_branch_id_for_org(org)
      end

      def risk_summary
        begin
          rule_counts = rules_stat_summary
          critical_counts = http_get_from_json(SYSTEM_STATS_PATH, {:minSeverity => :CRITICAL}, true)
          return OpenStruct.new({:critical_count => critical_counts.affected,
                                 :system_count => critical_counts.total,
                                 :low_percent => percent(rule_counts.info,rule_counts.total),
                                 :medium_percent => percent(rule_counts.warn,rule_counts.total),
                                 :high_percent => percent(rule_counts.error,rule_counts.total),
                                 :critical_percent => percent(rule_counts.critical,rule_counts.total)
                                })
        rescue Exception => e
          return error_response("Unable to get risk summary : #{e}")
        end
        # return {:critical_count => 10,
        #         :system_count => 100,
        #         :low_percent => 1.2,
        #         :medium_percent => 38.4,
        #         :high_percent => 17.5,
        #         :critical_percent => 24.2
        # }
      end

      def rules_stat_summary
        begin
          http_get_from_json(RULE_STATS_PATH, {}, true)
        rescue Exception => e
          return error_response("Unable to get rule summary : #{e}")
        end
      end


      def all_weekly_mail_data
        data = []
        @user_map = current_user_map
        current_user_map.each do |key,user|
          begin
            user_data = weekly_summary_data(user.login)
            data.push(user_data) unless user_data.nil? || user_data[:data].nil? || user_data[:data].total_systems == 0
          rescue => e
            Rails.logger.warn("Unable to get weekly email data for user : #{e}")
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
        machines.sort
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

      def percent(fraction, total)
        if (total== 0)
          return 0
        end
        ((fraction.to_f/total)*100).round(1)
      end

      def error_response(message)
         resp = OpenStruct.new
         resp.query_error = message
         resp
      end

      def http_get_from_json(resource,params,use_subsets=true)
        options = {:method => :GET,
                   :resource => resource,
                   :params => params,
                   :payload => nil,
                   :use_subsets => use_subsets
        }
        json_data = http_request(options, true);
        JSON.parse(json_data, object_class: OpenStruct)
      end

      def current_user_map
        map = {}
        User.as_anonymous_admin  do
          users = ::User.select do |user|
            user.receives?(:insights_notifications) && user.mail_enabled? && user.allowed_organizations.include?(@org)
          end
          users.each do |user|
            map[user_login_to_hash(user.login)] = user
          end
        end
        map
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
                                                        {timeout: get_tapi_timeout},
                                                        options[:use_subsets])
        if res.key?(:error)
          raise res[:error]
        end
        res[:data]

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
