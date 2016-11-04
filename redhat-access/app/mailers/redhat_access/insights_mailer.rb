module RedhatAccess
  class InsightsMailer < ApplicationMailer

    def create(user, body, subject, content_type="text/html")
      mail(to: user.mail,
           body: body,
           content_type: content_type,
           subject: subject)
    end
  end
end