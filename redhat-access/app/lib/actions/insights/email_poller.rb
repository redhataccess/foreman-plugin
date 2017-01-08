module Actions
  module Insights
    class EmailPoller < Actions::Base
      include RedhatAccess::Telemetry::LookUps
      middleware.use Actions::Middleware::RecurringLogic
      class RunOnceCoordinatorLock < Dynflow::Coordinator::LockByWorld
        def initialize(world)
          super
          @data[:id] = 'insights-email-poller'
        end
      end

      class << self
        attr_reader :triggered_action
        def ensure_running(world = ForemanTasks.dynflow.world)
          world.coordinator.acquire(RunOnceCoordinatorLock.new(world)) do
            unless ForemanTasks::Task::DynflowTask.for_action(self).any?
              params = {:mode => :recurring,
                        :input_type => :cronline,
                        :cronline => "00 00 * * 6"}
              @triggered_action = ForemanTasks::Triggering.new_from_params(params).trigger(self)
            end
          end
        rescue Dynflow::Coordinator::LockError
          return false
        end
      end

      def humanized_name
        N_('Insights Email Notifications')
      end

      def plan
        # Make sure we only have one instance
        Rails.logger.debug("Planning Task ")
        plan_self
      end

      def run
        Rails.logger.debug("Running Task")
        Organization.all.each do |org|
           if telemetry_enabled?(org) && is_susbcribed_to_redhat?(org)
             weekly_summary(org)
           end
        end
      end

      def weekly_summary(org)
        message_svc = RedhatAccess::Telemetry::MessagingService.new(org)
        weekly_data_list = message_svc.all_weekly_mail_data
        weekly_data_list.each do |info|
          RedhatAccess::InsightsMailer.weekly_email(info[:user], info[:data], "Insights Weekly Summary",org).deliver_now
        end
      end


      def rescue_strategy_for_self
        Dynflow::Action::Rescue::Skip
      end

    end
  end

end