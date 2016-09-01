require_dependency "redhat_access/application_controller"

module RedhatAccess
  module Api
    class LogsController < RedhatAccess::Api::ApiController
      # Use temporary implementation to show proof of ooncept in beta release
      # In GA a more robust implementation will be used
      #@@log_files = ['/var/log/foreman/production.log','/var/log/foreman/delayed_job.log','/var/log/foreman/jobs-startup.log']
      @@log_files = REDHAT_ACCESS_CONFIG[:diagnostic_logs]

      def index
        #
        # This REST hack of using index for both list and specific resource get
        # is being forced by the current UI design
        #
        path = params[:path]
        if path.nil?
          render  :plain => get_available_logs, :layout => false
        else
          if is_valid_file? path
            render :file => path, :layout => false
          else
            render :text => ''
          end
        end
      end

      def get_available_logs
        files = @@log_files.select do |file|
          File.exist?(file) && File.readable?(file) && File.size(file) > 0
        end
        files.join("\n")
      end

      def is_valid_file?  file
        @@log_files.include?(file) && File.exist?(file) && File.readable?(file) && File.size(file) > 0
      end


      def permission_denied
        render :template => "katello/common/403"
      end

      def api_version
        'v1'
      end
    end
  end
end
