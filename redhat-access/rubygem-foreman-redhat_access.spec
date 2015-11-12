%{?scl:%scl_package rubygem-%{gem_name}}
%{!?scl:%global pkg_name %{name}}

%global gem_name redhat_access
%global rubyabi 1.9.1
%global foreman_dir /usr/share/foreman
%global foreman_bundlerd_dir %foreman_dir/bundler.d
%global foreman_assets_dir %foreman_dir/public/assets
%global rubygem_redhat_access_dir %{gem_dir}/gems/%{gem_name}-%{version}

# For we bundle the puppet module required.
# See https://forge.puppetlabs.com/lphiri/access_insights_client
%global puppet_module_version 0.0.8
%global puppet_module access_insights_client
%global puppet_modules_dir /usr/share/puppet/modules
%global puppet_full_name lphiri-%{puppet_module}-%{puppet_module_version}


%if "%{?scl}" == "ruby193"
    %global scl_rake /usr/bin/ruby193-rake
%else
    %global scl_rake /usr/bin/rake
%endif

Name: %{?scl_prefix}rubygem-foreman-%{gem_name}
Version: 0.2.4
Release: 1%{?dist}
Summary: Foreman engine to access Red Hat knowledge base and manage support cases.
Group: Development/Languages
License: GPLv2+
URL: https://github.com/redhataccess/foreman-plugin
Source0: %{gem_name}-%{version}.gem
Source1: %{puppet_full_name}.tar.gz


Requires: foreman => 1.5.0

Requires: %{?scl_prefix}ruby(abi)
Requires: %{?scl_prefix}rubygems
Requires: %{?scl_prefix}rubygem(rails)
Requires: %{?scl_prefix}rubygem-angular-rails-templates >= 0.0.4
Requires: %{?scl_prefix}rubygem-redhat_access_lib >= 0.0.6

BuildRequires: %{?scl_prefix}rubygem-angular-rails-templates >= 0.0.4
BuildRequires: %{?scl_prefix}ruby(abi)
BuildRequires: %{?scl_prefix}rubygems
BuildRequires: %{?scl_prefix}rubygems-devel
BuildRequires: %{?scl_prefix}rubygem(rake)
BuildRequires: %{?scl_prefix}rubygem(sass-rails)
BuildRequires: %{?scl_prefix}rubygem(sqlite3)
BuildRequires: %{?scl_prefix}rubygem(jquery-rails)
BuildRequires: %{?scl_prefix}rubygem(uglifier)
BuildRequires: %{?scl_prefix}rubygem(haml-rails)
BuildRequires: %{?scl_prefix}rubygem(therubyracer)


BuildArch: noarch

Provides: %{?scl_prefix}rubygem(foreman-%{gem_name}) = %{version}

%description
Foreman engine to access Red Hat knowledge base search

%prep


%{?scl:scl enable %{scl} "}
gem unpack %{SOURCE0}
%{?scl:"}

%setup -q -D -T -n  %{gem_name}-%{version}

#Manually unpack puppet module to workaround %setup issues
cd $RPM_BUILD_DIR
rm -rf %{puppet_full_name}
gzip -dc %{SOURCE1} | tar -xvvf -
if [ $? -ne 0 ]; then
  exit $?
fi
cd %{puppet_full_name}
chmod -R a+rX,g-w,o-w .


%build
mkdir -p .%{gem_dir}

# precompile JavaScript assets...
%{scl_rake} assets:precompile:engine --trace

# Create our gem
%{?scl:scl enable %{scl} "}
gem build %{gem_name}.gemspec
%{?scl:"}

# install our gem locally, to be move into buildroot in %%install
%{?scl:scl enable %{scl} "}
gem install --local --no-wrappers --install-dir .%{gem_dir} --force --no-rdoc --no-ri %{gem_name}-%{version}.gem
%{?scl:"}

%install
mkdir -p %{buildroot}%{gem_dir}
mkdir -p %{buildroot}%{foreman_bundlerd_dir}
mkdir -p %{buildroot}%{foreman_assets_dir}
mkdir -p %{buildroot}/etc/redhat_access
mkdir -p %{buildroot}/etc/pam.d
mkdir -p %{buildroot}/etc/security/console.apps
mkdir -p %{buildroot}/usr/sbin
mkdir -p %{buildroot}/usr/bin


cp -pa .%{gem_dir}/* %{buildroot}%{gem_dir}/

cat <<GEMFILE > %{buildroot}%{foreman_bundlerd_dir}/%{gem_name}.rb
gem 'redhat_access'
GEMFILE

# add link to precompiled assets
ln -s %{rubygem_redhat_access_dir}/public/assets/redhat_access %{buildroot}%{foreman_assets_dir}/redhat_access

# copy sos report functions
cp -pa .%{rubygem_redhat_access_dir}/script/sos_reports/foreman_sosreport.pam %{buildroot}/etc/pam.d/foreman-sosreport
cp -pa .%{rubygem_redhat_access_dir}/script/sos_reports/foreman_sosreport_console.apps %{buildroot}/etc/security/console.apps/foreman-sosreport
cp -pa .%{rubygem_redhat_access_dir}/script/sos_reports/foreman_sosreport_wrapper.py %{buildroot}/usr/sbin/foreman-sosreport-wrapper
chmod 755 %{buildroot}/usr/sbin/foreman-sosreport-wrapper
ln -s /usr/bin/consolehelper %{buildroot}/usr/bin/foreman-sosreport
cp -pa .%{rubygem_redhat_access_dir}/config/config.yml.example %{buildroot}/etc/redhat_access/config.yml

#puppet module installation
mkdir -p %{buildroot}/%{puppet_modules_dir}/%{puppet_module}
cp -p $RPM_BUILD_DIR/%{puppet_full_name}/README.md %{buildroot}/%{puppet_modules_dir}/%{puppet_module}/
cp -p $RPM_BUILD_DIR/%{puppet_full_name}/metadata.json %{buildroot}/%{puppet_modules_dir}/%{puppet_module}/
cp -rp $RPM_BUILD_DIR/%{puppet_full_name}/manifests/ %{buildroot}/%{puppet_modules_dir}/%{puppet_module}/manifests
cp -rp $RPM_BUILD_DIR/%{puppet_full_name}/templates/ %{buildroot}/%{puppet_modules_dir}/%{puppet_module}/templates

%files
%defattr(-,root,root,-)
%{gem_dir}
%{foreman_bundlerd_dir}/%{gem_name}.rb
%{foreman_assets_dir}/redhat_access
/etc/redhat_access
/etc/pam.d/foreman-sosreport
/etc/security/console.apps
/usr/sbin/foreman-sosreport-wrapper
/usr/bin/foreman-sosreport

%{puppet_modules_dir}/%{puppet_module}

%changelog

* Thu Nov 12 2015 Lindani Phiri <lindani@redhat.com> - 0.2.4-1
- Resolves : bz1276676

* Mon Aug 17 2015 Lindani Phiri <lindani@redhat.com> - 0.2.3-1
- Resolves : bz1254252

* Mon Aug 3 2015 Lindani Phiri <lindani@redhat.com> - 0.2.2-1
- UI library update for RHAI entitlements
- Resolves : bz1246632

* Mon Jul 13 2015 Lindani Phiri <lindani@redhat.com> - 0.2.1-1
- GA build for Access Insights
- Resolves : bz1193202
- Resolves : bz1187091
- Resolves : bz1192207
- Resolves : bz1224202

* Fri Jun 5 2015 Lindani Phiri <lindani@redhat.com> - 0.2.0-8
- Fix fat figured space into puppet module template
- Resolves : bz1217726

* Thu Jun 4 2015 Lindani Phiri <lindani@redhat.com> - 0.2.0-7
- Make Insights proxy on by default to support RHCI
- Resolves : bz1217726

* Tue May 19 2015 Lindani Phiri <lindani@redhat.com> - 0.2.0-6
- First tech preview  release of RHAI for QA testing
- Resolves : bz1217726

* Mon Mar 23 2015 Lindani Phiri <lindani@redhat.com> - 0.1.0-1
- Database prep for z stream for RHAI (BZ 1197764)

* Wed Mar 4 2015 Lindani Phiri <lindani@redhat.com> - 0.0.9-1
- Resolves : bz1197764

* Thu Feb 19 2015 Lindani Phiri <lindani@redhat.com> - 0.0.8-2
- Resolves : bz1193672

* Thu Feb 12 2015 Lindani Phiri <lindani@redhat.com> - 0.0.8-1
- Removed proactive support
- Resolves : bz1191406

* Fri Dec 12 2014 Lindani Phiri <lindani@redhat.com> - 0.0.7-1
- Add proactive support
- Resolves: bz1131538
- Resolves: bz1145742

* Wed May 14 2014 Rex White <rexwhite@redhat.com> - 0.0.4-1
- Resolves: bz1084590
- Updated for UX comments

* Wed May 14 2014 Rex White <rexwhite@redhat.com> - 0.0.3-1
- Resolves: bz1084590

* Wed May 14 2014 Rex White <rexwhite@redhat.com> - 0.0.3-1
- Version: 0.0.3-1
- Fixed rake asset precompilation to work on RHEL 7

* Tue Apr 29 2014 Rex White <rexwhite@redhat.com>
- Renamed spec file
- Added SOS report files

* Tue Apr 22 2014 Rex White <rexhwite@redhat.com>
- Fixed asset pre-compile issues
- Fixed incorrect foreman path variables

* Thu Apr 3 2014 Rex White <rexwhite@redhat.com>
- Initial package
