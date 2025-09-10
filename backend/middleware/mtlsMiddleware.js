const mTLSConfig = require('../config/mtls');
const auditLogger = require('../services/auditLogger');

const mTLSMiddleware = (req, res, next) => {
    try {
        // Client certificate bilgilerini al
        const clientCert = req.headers['x-client-certificate'];
        const clientVerify = req.headers['x-client-verify'];

        // mTLS gerekli endpoint'ler için kontrol
        if (req.path.startsWith('/api/secure/')) {
            if (!clientCert || clientVerify !== 'SUCCESS') {
                // Audit log
                auditLogger.logEvent('security.mtls.failed', 'system', {
                    path: req.path,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    reason: 'Missing or invalid client certificate'
                });

                return res.status(403).json({
                    error: 'S-403',
                    message: 'Client certificate required for this endpoint',
                    code: 'mtls-required'
                });
            }

            // Certificate bilgilerini parse et
            const certInfo = parseCertificate(clientCert);

            // Certificate geçerlilik kontrolü
            if (!isValidCertificate(certInfo)) {
                auditLogger.logEvent('security.mtls.invalid', 'system', {
                    path: req.path,
                    ip: req.ip,
                    certificate: certInfo,
                    reason: 'Invalid certificate'
                });

                return res.status(403).json({
                    error: 'S-403',
                    message: 'Invalid client certificate',
                    code: 'mtls-invalid'
                });
            }

            // Request'e certificate bilgilerini ekle
            req.mtls = {
                clientCert: certInfo,
                verified: true
            };

            // Audit log
            auditLogger.logEvent('security.mtls.success', 'system', {
                path: req.path,
                ip: req.ip,
                certificate: certInfo
            });
        }

        next();
    } catch (error) {
        console.error('mTLS middleware error:', error);

        auditLogger.logEvent('security.mtls.error', 'system', {
            path: req.path,
            ip: req.ip,
            error: error.message
        });

        return res.status(500).json({
            error: 'S-500',
            message: 'mTLS validation failed',
            code: 'mtls-error'
        });
    }
};

// Certificate parse et
function parseCertificate(certHeader) {
    try {
        // Certificate header'dan PEM formatını çıkar
        const certPem = certHeader.replace(/-----BEGIN CERTIFICATE-----/, '')
            .replace(/-----END CERTIFICATE-----/, '')
            .replace(/\s/g, '');

        // Base64 decode
        const certBuffer = Buffer.from(certPem, 'base64');

        // Basit certificate bilgilerini çıkar
        const certString = certBuffer.toString('utf8');

        return {
            subject: extractSubject(certString),
            issuer: extractIssuer(certString),
            validFrom: extractValidFrom(certString),
            validTo: extractValidTo(certString),
            serialNumber: extractSerialNumber(certString)
        };
    } catch (error) {
        console.error('Certificate parsing error:', error);
        return null;
    }
}

// Certificate alanlarını çıkar
function extractSubject(certString) {
    const match = certString.match(/Subject: ([^\n]+)/);
    return match ? match[1] : 'Unknown';
}

function extractIssuer(certString) {
    const match = certString.match(/Issuer: ([^\n]+)/);
    return match ? match[1] : 'Unknown';
}

function extractValidFrom(certString) {
    const match = certString.match(/Not Before: ([^\n]+)/);
    return match ? match[1] : 'Unknown';
}

function extractValidTo(certString) {
    const match = certString.match(/Not After: ([^\n]+)/);
    return match ? match[1] : 'Unknown';
}

function extractSerialNumber(certString) {
    const match = certString.match(/Serial Number: ([^\n]+)/);
    return match ? match[1] : 'Unknown';
}

// Certificate geçerlilik kontrolü
function isValidCertificate(certInfo) {
    if (!certInfo) return false;

    try {
        // Basit geçerlilik kontrolü
        const now = new Date();
        const validFrom = new Date(certInfo.validFrom);
        const validTo = new Date(certInfo.validTo);

        return now >= validFrom && now <= validTo;
    } catch (error) {
        console.error('Certificate validation error:', error);
        return false;
    }
}

module.exports = mTLSMiddleware;
