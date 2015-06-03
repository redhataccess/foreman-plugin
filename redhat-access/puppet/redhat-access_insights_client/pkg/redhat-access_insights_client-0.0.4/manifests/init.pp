# == Class: access_insights_client
#
# Full description of class access_insights_client here.
#
# === Parameters
#
# Document parameters here.
#
# [*sample_parameter*]
#   Explanation of what this parameter affects and what it defaults to.
#   e.g. "Specify one or more upstream ntp servers as an array."
#
# === Variables
#
# Here you should define a list of variables that this module would require.
#
# [*sample_variable*]
#   Explanation of how this variable affects the funtion of this class and if
#   it has a default. e.g. "The parameter enc_ntp_servers must be set by the
#   External Node Classifier as a comma separated list of hostnames." (Note,
#   global variables should be avoided in favor of class parameters as
#   of Puppet 2.6.)
#
# === Examples
#
#  class { access_insights_client:
#    servers => [ 'pool.ntp.org', 'ntp.local.company.com' ],
#  }
#
# === Authors
#
# Lindani Phiri <lphiri@redhat.com>
# Dan Varga  <dvarga@redhat.com>
#
# === Copyright
#
# Copyright 2015 Red Hat Inc.
#
class access_insights_client(
	$log_level = undef,
    $auto_config = 'True',
    $authmethod = undef,
    $username = undef,
    $password = undef,
    $base_url = undef,
    $proxy = undef,
    $cert_verify = undef,
    $gpg = undef,
    $auto_update = undef,
    $obsfucate = undef,
    $obsfucate_hostname = undef,
    $upload_schedule = 'weekly',
){
    package {'redhat-access-insights':
      ensure   => latest,
      provider => yum,
      source   => 'redhat-access-insights',
    }

    file {'/etc/redhat-access-insights/redhat-access-insights.conf':
      ensure   => file,
      content  => template('access_insights_client/redhat-access-insights.conf.erb'),
      require  => Package['redhat-access-insights'],
    }

    case $upload_schedule {
        daily: { file { '/etc/cron.daily/redhat-access-insights':
            ensure => 'link',
            target => '/etc/redhat-access-insights/redhat-access-insights.cron',
            require  => Package['redhat-access-insights'],
        }}
        weekly: { file { '/etc/cron.weekly/redhat-access-insights':
            ensure => 'link',
            target => '/etc/redhat-access-insights/redhat-access-insights.cron',
            require  => Package['redhat-access-insights'],
        }}
        default: { file { '/etc/cron.daily/redhat-access-insights':
            ensure => 'link',
            target => '/etc/redhat-access-insights/redhat-access-insights.cron',
            require  => Package['redhat-access-insights'],
        }}
    }  
    exec { "/usr/bin/redhat-access-insights --register":
        creates => "/etc/redhat-access-insights/.registered",
        unless => "/usr/bin/test -f /etc/redhat-access-insights/.unregistered",
        require => Package['redhat-access-insights']
    }
}