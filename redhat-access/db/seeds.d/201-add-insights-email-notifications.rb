# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# !!! PLEASE KEEP THIS SCRIPT IDEMPOTENT !!!
#
::User.current = ::User.anonymous_api_admin

# Mail Notifications
notifications = [
    {:name              => :insights_notifications,
     :description       => N_('Insights reports and messages for registered hosts'),
     :mailer            => 'RedhatAccess::InsightsMailer',
     :method            => 'create',
     :subscription_type => 'alert'
    }
]

notifications.each do |notification|
  ::MailNotification.where(name: notification[:name]).first_or_create!(notification)
end

::User.current = nil