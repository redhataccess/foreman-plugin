#!/usr/bin/python
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

""" sos entry point. """

from sos.sosreport import main
import os
import pwd
import sys
import tempfile

if __name__ == '__main__':
    for arg in sys.argv:
        if arg.startswith('--tmp-dir=') or arg == '--tmp-dir':
            sys.exit('--tmp-dir was passed to foreman-sosreport, and will conflict'
                     ' with changes foreman-sosreport performs... exiting')

    newtmpdir = tempfile.mkdtemp()
    sys.argv.append('--tmp-dir=%s' % (newtmpdir))

    try:
        main(sys.argv[1:])
    except KeyboardInterrupt:
        raise SystemExit()

    filelist = os.listdir(newtmpdir)
    filelist.append('')

    foreman_uid = -1  # Ensures chown no-op if something weird happens in pwd.

    try:
        # get uid, this may raise KeyError if it can't lookup
        foreman_uid = pwd.getpwnam('foreman').pw_uid
    except KeyError:
        pass

    for file in filelist:
        try:
            # change UID, leave GID as-is, may raise OSError
            os.chown(os.path.join(newtmpdir, file), foreman_uid, -1)
        except OSError:
            print sys.exc_info()
            sys.exit("unable to chown file %s to foreman user" % (file))

    print "sosreport files saved to: %s" % (newtmpdir)

# vim:ts=4 et sw=4

