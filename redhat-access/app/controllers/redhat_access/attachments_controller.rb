require_dependency "redhat_access/application_controller"

module RedhatAccess
  class AttachmentsController < ApplicationController
    def index
      render :text => "SOS Report",
        :layout => false
    end

    def post
      begin
        case_number = params[:case_number]
        sos_file = RedhatAccess::SosReports::Generator.create_report case_number
        strata = RedhatAccess::Strata::Client.new(nil)
        strata.api.attachment_broker.add(case_number,
                                         false,
                                         sos_file,
                                         "Attachment for case #{case_number}")
        render :nothing => true, :status => 201
      rescue => e
        puts e.backtrace
        render :text => "Error attaching sos file" + e.message
      end
    end
  end
end
