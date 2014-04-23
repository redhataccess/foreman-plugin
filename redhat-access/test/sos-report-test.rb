require 'open3'
puts "starting"
command = "foreman-sosreport " +
					"--batch " + 
					"-o rpm,libvirt,general,networking,hardware,process,yum,filesys,devicemapper" +
					",kernel,apache,memory "+
					"-k general.all_logs=True " +
					"-k apache.log=True " +
					"-k rpm.rpmva=off"
puts "running command"+ command
#system command
puts "done runnng "

puts "run with opens3"

Open3.popen3(command) do |stdin, stdout, stderr, wait_thr|
  pid = wait_thr.pid # pid of the started process.
  #puts stdout.readlines
  report_location = ''
  if wait_thr.value == 0 
  	stdout.readlines.each do |line|
  		if line.include? "tar.xz"
  			report_location = line
  			break
  		end
  	end
  else
  	puts "sos report failed"
  end
  puts report_location
end

