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
                        :cronline => "30 * * * *"}
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
        Rails.logger.info("Planning Task ")
        plan_self
      end

      def run
        Rails.logger.info("Running Task")
        Organization.all.each do |org|
           if telemetry_enabled?(org)
             process_emails(org)
           end
        end
      end

      def process_emails(org)
        message_svc = RedhatAccess::Telemetry::MessagingService.new(org)
        message_svc.all_messages.each do |message|
          begin
            MailNotification[:insights_notifications].deliver(message[:user], message[:body], message[:subject])
          rescue => e
            message = _('Unable to send insights e-mail notification: %{error}' % {:error => e})
            Rails.logger.error(message)
            #output[:result] = message
          end
        end
      end

      def rescue_strategy_for_self
        Dynflow::Action::Rescue::Skip
      end

    end
  end

end