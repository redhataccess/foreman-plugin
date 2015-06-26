# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
require 'open3'
module RedhatAccess::SosReports
  SOS_COMMAND = "foreman-sosreport --batch -o foreman"
  class Generator
    def self.create_report case_num
      command = SOS_COMMAND
      unless case_num.nil?
        unless is_valid_case_number case_num  #security injection check
          raise ArgumentError.new "case number must be an integer"
        else
          command = command + " --ticket-number=#{case_num}"
        end
      end
      Open3.popen3(command) do |stdin, stdout, stderr, wait_thr|
        report_location = ''
        if wait_thr.value == 0
          stdout.readlines.each do |line|
            if line.include? "tar.xz"
              report_location = line #brittle, but we assume only single line
              break
            end
          end
        else
          #puts "sos report failed"
        end
        sos_file_name = report_location.strip
        puts "SOS file created : " + sos_file_name
        sos_file_name
      end
    end

    def self.is_valid_case_number case_num
      if case_num.nil?
        return false
      end
      case_num.to_s =~ /\A\d+\z/ ? true : false
    end
  end
end
