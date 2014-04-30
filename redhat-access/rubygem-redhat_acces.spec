%{?scl:%scl_package rubygem-%{gem_name}}
%{!?scl:%global pkg_name %{name}}

%global gem_name redhat_access
%global rubyabi 1.9.1
%global foreman_dir /usr/share/foreman
%global foreman_bundlerd_dir %foreman_dir/bundler.d
%global foreman_assets_dir %foreman_dir/public/assets
%global rubygem_redhat_access_dir %{gem_dir}/gems/%{gem_name}-%{version}

Name: %{?scl_prefix}rubygem-%{gem_name}
Version: 0.0.1
Release: 1%{?dist}
Summary: Foreman engine to access Red Hat knowledge base
Group: Development/Languages
License: GPLv2+
URL: https://github.com/redhataccess/foreman-plugin
Source0: %{gem_name}-%{version}.gem

Requires: %{?scl_prefix}rubygem(redhat_support_lib)

Requires: foreman => 1.3.0

Requires: %{?scl_prefix}ruby(abi)
Requires: %{?scl_prefix}rubygems
Requires: %{?scl_prefix}rubygem(rails)

BuildRequires: %{?scl_prefix}ruby(abi)
BuildRequires: %{?scl_prefix}rubygems
BuildRequires: %{?scl_prefix}rubygems-devel
BuildRequires: %{?scl_prefix}rubygem(rake)
BuildRequires: %{?scl_prefix}rubygem(sass-rails)
BuildRequires: %{?scl_prefix}rubygem(sqlite3)
BuildRequires: %{?scl_prefix}rubygem(angular-rails-templates)
BuildRequires: %{?scl_prefix}rubygem(jquery-rails)
BuildRequires: %{?scl_prefix}rubygem(uglifier)
BuildRequires: %{?scl_prefix}rubygem(haml-rails)
BuildRequires: %{?scl_prefix}rubygem(therubyracer)

BuildArch: noarch

Provides: %{?scl_prefix}rubygem(%{gem_name}) = %{version}

%description
Foreman engine to access Red Hat knowledge base search

%prep
%{?scl:scl enable %{scl} "gem unpack %{SOURCE0}"}

%setup -q -D -T -n  %{gem_name}-%{version}

%build
mkdir -p .%{gem_dir}

# precompile JavaScript assets...
%{?scl:scl enable %{scl} "rake assets:precompile:engine --trace"}

# Create our gem
%{?scl:scl enable %{scl} "gem build %{gem_name}.gemspec"}

# install our gem locally, to be move into buildroot in %%install
%{?scl:scl enable %{scl} "gem install --local --no-wrappers --install-dir .%{gem_dir} --force --no-rdoc --no-ri %{gem_name}-%{version}.gem"}

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
ln -s %{buildroot}/usr/bin/consolehelper %{buildroot}/usr/bin/foreman-sosreport
cp -pa .%{rubygem_redhat_access_dir}/config/config.yml.example %{buildroot}/etc/redhat_access/config.yml

%files
%defattr(-,root,root,-)
%{gem_dir}
%{foreman_bundlerd_dir}/%{gem_name}.rb
%{foreman_assets_dir}/redhat_access
/etc/redhat_access
/etc/pam.d
/etc/security/console.apps
/usr/sbin
/usr/bin

%changelog
* Wed Apr 30 2014 Rex White <rexwhite@redhat.com> - 0.0.1-1
- Resolves: bz1084590

* Tue Apr 29 2014 Rex White <rexwhite@redha.com>
- Renamed spec file
- Added SOS report files

* Tue Apr 22 2014 Rex White <rexhwite@redhat.com>
- Fixed asset pre-compile issues
- Fixed incorrect foreman path variables

* Thu Apr 3 2014 Rex White <rexwhite@redhat.com>
- Initial package

