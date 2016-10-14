module Actions
  module Insights
    class EmailPoller < Actions::Base
      #middleware.use Actions::Middleware::RecurringLogic
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
                        :cronline => "19 * * * *"}
              @triggered_action = ForemanTasks::Triggering.new_from_params(params).trigger(self)
              #ForemanTasks.async_task(::Actions::Insights::EmailPoller)
            end
          end
        rescue Dynflow::Coordinator::LockError
          return false
        end
      end

      def humanized_output
        ""
      end
      #
      def plan
        # Make sure we only have one instance
        Rails.logger.info("Planning Task ")
        plan_self
      end

      def run
        Rails.logger.info("Running Task")
      end
    end
  end

end