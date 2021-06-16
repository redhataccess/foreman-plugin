foreman-plugin
==============

This plugin extends the Foreman UI  ( https://github.com/theforeman/foreman ) with features that allow subscribed users to interact with the Red Hat Customer Portal.
This includes ability to search the Red Hat Knowledge Base, Support Case Management 
and Log Diagnostics.

## Satellite .rpm Builds

Installable rpms are built by koji brew via the [satellite-packaging repository](https://gitlab.sat.engineering.redhat.com/satellite6/satellite-packaging).
Follow the directions pointed to in the repo README to install the necessary packages to use obal, the build front-end utility,
or use the Dockerfile in the build directory to create a suitable image.

1. `git clone` the [satellite-packaging repository](https://gitlab.sat.engineering.redhat.com/satellite6/satellite-packaging)
2. `git checkout <satellite-version>`  (`git branch --all` for list)
3. `gem build redhat_access.gemspec` to build your new gem
3. Copy your new gem to satellite-packaging/packages/rubygem-redhat_access
4. Update satellite-packaging/packages/rubygem-redhat_access.spec with the new redhat_access gem version
5. (optional) `docker build -t plugin_builder`
6. (optional) `docker run -it -v $(pwd)/../satellite-packaging:/root/satellite-packaging --rm plugin_builder`
7. `cd` to the satellite-packaging dir
8. Koji brew uses your kerberos credentials so `kinit <your ldap id>@REDHAT.COM`
9. `obal setup`
10. `obal scratch rubygem-redhat_access` 

To install your newly built plugin on a satellite: `satellite-maintain packages install tfm-rubygem-redhat_access-2.2.19-1.el7sat.noarch.rpm`