const crypto = require('crypto');

// Nonce oluştur
const generateNonce = () => {
    return crypto.randomBytes(16).toString('base64');
};

// CSP nonce'ları oluştur
const generateCSPNonces = () => {
    return {
        script: generateNonce(),
        style: generateNonce()
    };
};

const securityHeaders = (req, res, next) => {
    try {
        // Nonce'ları oluştur
        const nonces = generateCSPNonces();

        // Nonce'ları response'a ekle
        res.locals.nonces = nonces;

        // HSTS (HTTP Strict Transport Security)
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

        // X-Frame-Options (Clickjacking koruması)
        res.setHeader('X-Frame-Options', 'DENY');

        // X-Content-Type-Options (MIME type sniffing koruması)
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // Referrer Policy
        res.setHeader('Referrer-Policy', 'no-referrer');

        // Permissions Policy (Feature Policy)
        res.setHeader('Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
        );

        // X-XSS-Protection (eski tarayıcılar için)
        res.setHeader('X-XSS-Protection', '1; mode=block');

        // Content Security Policy (CSP)
        const csp = [
            `default-src 'self'`,
            `script-src 'self' 'nonce-${nonces.script}' 'strict-dynamic'`,
            `style-src 'self' 'nonce-${nonces.style}' 'unsafe-inline'`,
            `img-src 'self' data: https:`,
            `font-src 'self' data:`,
            `connect-src 'self' https://*.supabase.co wss://*.supabase.co`,
            `frame-src 'none'`,
            `frame-ancestors 'none'`,
            `object-src 'none'`,
            `base-uri 'self'`,
            `form-action 'self'`,
            `upgrade-insecure-requests`,
            `block-all-mixed-content`
        ].join('; ');

        res.setHeader('Content-Security-Policy', csp);

        // Trusted Types (XSS koruması)
        res.setHeader('Content-Type', `${res.getHeader('Content-Type') || 'text/html'}; trusted-types default`);

        // Cross-Origin Embedder Policy
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

        // Cross-Origin Opener Policy
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

        // Cross-Origin Resource Policy
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

        // Cache Control (sensitive data için)
        if (req.path.includes('/api/') || req.path.includes('/auth/')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }

        // Server bilgilerini gizle
        res.removeHeader('X-Powered-By');
        res.setHeader('Server', 'Microfrontend-Security');

        next();
    } catch (error) {
        console.error('Security headers error:', error);
        next();
    }
};

// CSP violation raporlama endpoint'i
const cspViolationReport = (req, res) => {
    try {
        const violation = req.body;

        console.warn('🚨 CSP Violation Detected:', {
            documentUri: violation['document-uri'],
            violatedDirective: violation['violated-directive'],
            blockedUri: violation['blocked-uri'],
            sourceFile: violation['source-file'],
            lineNumber: violation['line-number'],
            columnNumber: violation['column-number'],
            timestamp: new Date().toISOString()
        });

        // Violation'ı audit log'a kaydet
        const auditLogger = require('../services/auditLogger');
        auditLogger.logEvent('security.csp.violation', 'system', {
            violation: violation,
            severity: 'medium'
        });

        res.status(204).send();
    } catch (error) {
        console.error('CSP violation report error:', error);
        res.status(500).json({ error: 'CSP violation report failed' });
    }
};

// Nonce'ları template'e ekle
const addNoncesToResponse = (req, res, next) => {
    if (res.locals.nonces) {
        // Eğer HTML response döndürülüyorsa nonce'ları ekle
        const originalSend = res.send;
        res.send = function (data) {
            if (typeof data === 'string' && data.includes('<script')) {
                data = data.replace(/<script/g, `<script nonce="${res.locals.nonces.script}"`);
            }
            if (typeof data === 'string' && data.includes('<style')) {
                data = data.replace(/<style/g, `<style nonce="${res.locals.nonces.style}"`);
            }
            return originalSend.call(this, data);
        };
    }
    next();
};

module.exports = {
    securityHeaders,
    cspViolationReport,
    addNoncesToResponse
};
