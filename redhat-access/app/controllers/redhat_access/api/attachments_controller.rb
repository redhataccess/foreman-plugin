require_dependency "redhat_access/application_controller"
require_dependency "redhat_access/strata/client"
require_dependency "redhat_access/sos_reports/generator"

module RedhatAccess
  module Api
    class AttachmentsController < RedhatAccess::Api::ApiController
      wrap_parameters :attach_payload, format: :json
      def index
        render :text => "SOS Report?checked=true",
          :layout => false
      end

      def create
        data = params[:attach_payload]
        begin
          case_number = data[:caseNum]
          sos_file = RedhatAccess::SosReports::Generator.create_report case_number
          strata = RedhatAccess::Strata::Client.new(data[:authToken])
          strata.api.attachment_broker.add(case_number,
                                           false,
                                           sos_file,
                                           "Attachment for case #{case_number}")
          render :nothing => true,
            :status => 201
        rescue => e
          logger.error e.backtrace
          #logger.error "Failed to import facts for Host::Discovered: #{e}"
          render :text => "Error attaching sos file " + e.message,
            :layout => false ,
            :status => 500
        end
      end

      def api_version
        'v1'
      end
    end
  end
end
