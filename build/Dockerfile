FROM centos:7

RUN yum update -y && yum install -y centos-release-scl epel-release

# install python 3.6 and various build tools
RUN yum install -y krb5-workstation git git-annex rh-python36

# install rcm stuff, certificates, brew. and rhpkg
RUN cd /etc/yum.repos.d/ && curl -kL -O https://download.devel.redhat.com/rel-eng/RCMTOOLS/rcm-tools-rhel-7-workstation.repo
RUN rpm --nodeps -i http://hdn.corp.redhat.com/rhel7-csb-stage/RPMS/noarch/redhat-internal-cert-install-0.1-23.el7.csb.noarch.rpm
RUN yum install -y java-latest-openjdk-headless koji brewkoji rhpkg

# enable python scl on login
RUN echo "source /opt/rh/rh-python36/enable" >> ~/.bashrc

# pip install obal
RUN scl enable rh-python36 "pip install --upgrade pip"
RUN scl enable rh-python36 "pip install obal"

# fix kerberos config
COPY krb5.conf /etc/krb5.conf

# configure obal
#RUN scl enable rh-python36 "obal setup"

ENTRYPOINT /bin/bash