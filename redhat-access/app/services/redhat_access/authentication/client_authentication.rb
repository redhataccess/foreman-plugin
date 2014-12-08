# This is code is based on the katello project
#
require 'active_support'
require 'openssl'
require 'base64'


module RedhatAccess
  module Authentication
    module ClientAuthentication
      def authenticate_client
        set_client_user
        User.current.present?
      end

      def authorize_client
        authenticate_client
        require_login unless User.current
      end



      def deny_access
        render json: { :message => "Permission Denied." }, :status => 403
      end

      def set_client_user
        if cert_present?
          client_cert = RedhatAccess::Authentication::Cert.new(cert_from_request)
          uuid = client_cert.uuid
          User.current =  CertUser.new(:login => uuid)
        end
      end

      def cert_present?
        ssl_client_cert = cert_from_request
        !ssl_client_cert.nil? && !ssl_client_cert.empty? && ssl_client_cert != "(null)"
      end

      def cert_from_request
        request.env['SSL_CLIENT_CERT'] ||
          request.env['HTTP_SSL_CLIENT_CERT'] ||
          ENV['SSL_CLIENT_CERT'] ||
          ENV['HTTP_SSL_CLIENT_CERT']
      end
    end

    class CertUser < ::User
    end

    class Cert
      attr_accessor :cert
      def initialize(cert)
        self.cert = extract(cert)
      end
      def uuid
        drop_cn_prefix_from_subject(@cert.subject.to_s)
      end
      private
      def extract(cert)
        if cert.empty?
          fail('Invalid cert provided. Ensure that the provided cert is not empty.')
        else
          cert = strip_cert(cert)
          cert = Base64.decode64(cert)
          OpenSSL::X509::Certificate.new(cert)
        end
      end
      def drop_cn_prefix_from_subject(subject_string)
        subject_string.sub(/\/CN=/i, '')
      end
      def strip_cert(cert)
        cert = cert.to_s.gsub("-----BEGIN CERTIFICATE-----", "").gsub("-----END CERTIFICATE-----", "")
        cert.gsub!(' ', '')
        cert.gsub!(/\n/, '')
        cert
      end
    end
  end
end
