const fs = require('fs');
const path = require('path');

const CERT_DIR = path.join(__dirname, '../../infra/certs');

class mTLSConfig {
    constructor() {
        this.certificates = this.loadCertificates();
    }

    loadCertificates() {
        try {
            const caCert = fs.readFileSync(path.join(CERT_DIR, 'ca.crt'), 'utf8');
            const serverKey = fs.readFileSync(path.join(CERT_DIR, 'server.key'), 'utf8');
            const serverCert = fs.readFileSync(path.join(CERT_DIR, 'server.crt'), 'utf8');
            const clientCert = fs.readFileSync(path.join(CERT_DIR, 'client.crt'), 'utf8');

            return {
                ca: caCert,
                server: {
                    key: serverKey,
                    cert: serverCert
                },
                client: {
                    cert: clientCert
                }
            };
        } catch (error) {
            console.warn('mTLS sertifikaları yüklenemedi:', error.message);
            return null;
        }
    }

    getServerOptions() {
        if (!this.certificates) {
            return null;
        }

        return {
            key: this.certificates.server.key,
            cert: this.certificates.server.cert,
            ca: this.certificates.ca,
            requestCert: true,
            rejectUnauthorized: true
        };
    }

    getClientOptions() {
        if (!this.certificates) {
            return null;
        }

        return {
            cert: this.certificates.client.cert,
            ca: this.certificates.ca,
            rejectUnauthorized: true
        };
    }

    getCertificateStatus() {
        if (!this.certificates) {
            return {
                status: 'missing',
                message: 'Sertifikalar bulunamadı'
            };
        }

        try {
            // Sertifika geçerlilik kontrolü
            const serverCert = this.certificates.server.cert;
            const clientCert = this.certificates.client.cert;

            // Basit geçerlilik kontrolü (gerçek uygulamada daha detaylı kontrol yapılabilir)
            const hasServerCert = serverCert && serverCert.includes('BEGIN CERTIFICATE');
            const hasClientCert = clientCert && clientCert.includes('BEGIN CERTIFICATE');

            return {
                status: hasServerCert && hasClientCert ? 'valid' : 'invalid',
                serverCert: hasServerCert,
                clientCert: hasClientCert,
                caCert: !!this.certificates.ca
            };
        } catch (error) {
            return {
                status: 'error',
                message: error.message
            };
        }
    }
}

module.exports = new mTLSConfig();
