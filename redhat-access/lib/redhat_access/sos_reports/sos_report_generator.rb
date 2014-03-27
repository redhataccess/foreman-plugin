require 'open3'
module RedhatAccess::SosReports
	SOS_COMMAND = "foreman-sosreport " +
			"--batch " + 
			"-o rpm,libvirt,general,networking,hardware,process,yum,filesys,devicemapper" +
			",kernel,apache,memory "+
			"-k general.all_logs=True " +
			"-k apache.log=True " +
			"-k rpm.rpmva=off"
	class Generator
		def self.create_report
			Open3.popen3(SOS_COMMAND) do |stdin, stdout, stderr, wait_thr|
              report_location = ''
              if wait_thr.value == 0 
              	stdout.readlines.each do |line|
              		if line.include? "tar.xz"
              			report_location = line
              			break
              		end
              	end
              else
              	#puts "sos report failed"
              end
              puts report_location
          end
      end
  end
end
