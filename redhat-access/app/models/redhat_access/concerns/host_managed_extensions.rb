module RedhatAccess
  module Concerns
    module HostManagedExtensions
      extend ActiveSupport::Concern
      included do
        scoped_search :on => :plan_id, :complete_enabled => false,
          :only_explicit => true, :validator => ScopedSearch::Validators::INTEGER,
          :ext_method => :search_by_plan_id
      end

      module ClassMethods
        def search_by_plan_id(key, operator, value)
          insights_plan_runner = ForemanAnsible::InsightsPlanRunner.new(Organization.current, value.to_i)
          hostname_rules_relation = insights_plan_runner.hostname_rules(insights_plan_runner.playbook)
          hostnames = hostname_rules_relation.keys.map{|h| h.downcase}
          hostnames.map! { |hname| hname.split('.').first } if Setting[:use_shortname_for_vms]
          { :conditions => (hostnames.empty? ? ' 0 = 1' : " hosts.name IN(#{hostnames.join(',')})") }
        end
      end
    end
  end
end
