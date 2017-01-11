module RedhatAccess
  class InsightsMailer < ApplicationMailer

    def create(user, body, subject, content_type="text/html")
      mail(to: user.mail,
           body: body,
           content_type: content_type,
           subject: subject)
    end

    def weekly_email(user, data, subject, org)
      @user = user
      @data = data
      @org  = org
      @server_url = "#{Setting[:foreman_url]}/redhat_access/insights"
      @email_settings_url = "#{Setting[:foreman_url]}/users/#{user.id}/edit#mail_preferences"
      mail(to: user.mail,
           subject: subject)

    end
  end
end