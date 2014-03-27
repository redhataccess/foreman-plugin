require_dependency "redhat_access/application_controller"
require_dependency "redhat_access/sos_reports/sos_report_generator"

module RedhatAccess
	class LogViewerController < ApplicationController
		def index
			redirect_to '/redhat_access/#/logviewer'
		end

		def GetFileList

			list = "[{ \"roleName\" : \"User\", \"roleId\" : \"role1\", \"children\" : [ " +
			"{ \"roleName\" : \"subUser1\", \"roleId\" : \"role11\", \"children\" : [] }, " +
			"{ \"roleName\" : \"subUser2\", \"roleId\" : \"role12\", \"children\" : [ " +
			"{ \"roleName\" : \"subUser2-1\", \"roleId\" : \"role121\", \"children\" : [ "+
			"{ \"roleName\" : \"subUser2-1-1\", \"roleId\" : \"role1211\", \"children\" : [] }, "+
			"{ \"roleName\" : \"subUser2-1-2\", \"roleId\" : \"role1212\", \"children\" : [] } "+
			"]}]}]}]";

			render json: list
		end

		def GetMachineList
			render json: "[ \"Satellite Main\", \"Satellite Proxy1\", \"Satellite Proxy 2\"]"
		end

		def GetLogFile

			#render text: "Error contacting remote server."
			#RedhatAccess::SosReports::Generator.create_report
			render :file => "/home/lindani/production.log", :layout => false

		end

	end
end
