const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class CertificateManager {
    constructor() {
        this.certDir = path.join(__dirname, '../certs');
        this.certValidityDays = 365;
        this.init();
    }

    async init() {
        await fs.mkdir(this.certDir, { recursive: true });
        await this.generateCACertificate();
        await this.generateServerCertificates();
    }

    // CA sertifikası oluştur
    async generateCACertificate() {
        const caKeyPath = path.join(this.certDir, 'ca-key.pem');
        const caCertPath = path.join(this.certDir, 'ca-cert.pem');

        try {
            // CA private key oluştur
            await execAsync(`openssl genrsa -out ${caKeyPath} 4096`);

            // CA sertifikası oluştur
            await execAsync(`openssl req -new -x509 -days ${this.certValidityDays} -key ${caKeyPath} -out ${caCertPath} -subj "/C=TR/ST=Istanbul/L=Istanbul/O=Microfrontend/OU=Security/CN=Microfrontend-CA"`);

            console.log('✅ CA sertifikası oluşturuldu');
        } catch (error) {
            console.error('CA sertifikası oluşturma hatası:', error);
        }
    }

    // Sunucu sertifikaları oluştur
    async generateServerCertificates() {
        const services = ['auth-service', 'user-service', 'module-service', 'audit-service'];

        for (const service of services) {
            await this.generateServiceCertificate(service);
        }
    }

    // Servis sertifikası oluştur
    async generateServiceCertificate(serviceName) {
        const keyPath = path.join(this.certDir, `${serviceName}-key.pem`);
        const certPath = path.join(this.certDir, `${serviceName}-cert.pem`);
        const csrPath = path.join(this.certDir, `${serviceName}.csr`);

        try {
            // Private key oluştur
            await execAsync(`openssl genrsa -out ${keyPath} 2048`);

            // Certificate Signing Request oluştur
            await execAsync(`openssl req -new -key ${keyPath} -out ${csrPath} -subj "/C=TR/ST=Istanbul/L=Istanbul/O=Microfrontend/OU=Services/CN=${serviceName}"`);

            // CA ile imzala
            const caKeyPath = path.join(this.certDir, 'ca-key.pem');
            const caCertPath = path.join(this.certDir, 'ca-cert.pem');

            await execAsync(`openssl x509 -req -in ${csrPath} -CA ${caCertPath} -CAkey ${caKeyPath} -CAcreateserial -out ${certPath} -days ${this.certValidityDays}`);

            // CSR dosyasını sil
            await fs.unlink(csrPath);

            console.log(`✅ ${serviceName} sertifikası oluşturuldu`);
        } catch (error) {
            console.error(`${serviceName} sertifikası oluşturma hatası:`, error);
        }
    }

    // Sertifika doğrula
    async verifyCertificate(certPath, caCertPath) {
        try {
            const { stdout } = await execAsync(`openssl verify -CAfile ${caCertPath} ${certPath}`);
            return stdout.includes('OK');
        } catch (error) {
            return false;
        }
    }

    // Sertifika bilgilerini al
    async getCertificateInfo(certPath) {
        try {
            const { stdout } = await execAsync(`openssl x509 -in ${certPath} -text -noout`);
            return this.parseCertificateInfo(stdout);
        } catch (error) {
            console.error('Sertifika bilgisi alma hatası:', error);
            return null;
        }
    }

    // Sertifika bilgilerini parse et
    parseCertificateInfo(certText) {
        const info = {
            subject: this.extractField(certText, 'Subject:'),
            issuer: this.extractField(certText, 'Issuer:'),
            notBefore: this.extractField(certText, 'Not Before:'),
            notAfter: this.extractField(certText, 'Not After:'),
            serialNumber: this.extractField(certText, 'Serial Number:'),
            signatureAlgorithm: this.extractField(certText, 'Signature Algorithm:')
        };

        return info;
    }

    // Sertifika metninden alan çıkar
    extractField(text, fieldName) {
        const regex = new RegExp(`${fieldName}\\s+(.+)`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : null;
    }

    // Sertifika süresi kontrol et
    async isCertificateExpired(certPath) {
        try {
            const { stdout } = await execAsync(`openssl x509 -in ${certPath} -checkend 0`);
            return false; // Sertifika geçerli
        } catch (error) {
            return true; // Sertifika süresi dolmuş
        }
    }

    // Sertifika yenile
    async renewCertificate(serviceName) {
        console.log(`🔄 ${serviceName} sertifikası yenileniyor...`);
        await this.generateServiceCertificate(serviceName);
        console.log(`✅ ${serviceName} sertifikası yenilendi`);
    }

    // Tüm sertifikaları kontrol et
    async checkAllCertificates() {
        const services = ['auth-service', 'user-service', 'module-service', 'audit-service'];
        const results = [];

        for (const service of services) {
            const certPath = path.join(this.certDir, `${service}-cert.pem`);
            const caCertPath = path.join(this.certDir, 'ca-cert.pem');

            try {
                const isExpired = await this.isCertificateExpired(certPath);
                const isValid = await this.verifyCertificate(certPath, caCertPath);
                const info = await this.getCertificateInfo(certPath);

                results.push({
                    service,
                    isExpired,
                    isValid,
                    info
                });
            } catch (error) {
                results.push({
                    service,
                    isExpired: true,
                    isValid: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    // mTLS konfigürasyonu oluştur
    getMTLSConfig(serviceName) {
        const keyPath = path.join(this.certDir, `${serviceName}-key.pem`);
        const certPath = path.join(this.certDir, `${serviceName}-cert.pem`);
        const caPath = path.join(this.certDir, 'ca-cert.pem');

        return {
            key: keyPath,
            cert: certPath,
            ca: caPath,
            requestCert: true,
            rejectUnauthorized: true
        };
    }
}

module.exports = new CertificateManager();
