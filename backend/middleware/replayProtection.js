const crypto = require('crypto');
const encryption = require('../utils/encryption');

// In-memory nonce cache (production'da Redis kullanılmalı)
const nonceCache = new Map();
const NONCE_TTL = 5 * 60 * 1000; // 5 dakika
const TIMESTAMP_TOLERANCE = 120 * 1000; // 120 saniye

// Cache temizleme
setInterval(() => {
    const now = Date.now();
    for (const [nonce, timestamp] of nonceCache.entries()) {
        if (now - timestamp > NONCE_TTL) {
            nonceCache.delete(nonce);
        }
    }
}, 60 * 1000); // Her dakika temizle

const replayProtection = (req, res, next) => {
    try {
        const nonce = req.headers['x-nonce'];
        const timestamp = req.headers['x-ts'];
        const signature = req.headers['x-sign'];

        // Header kontrolü
        if (!nonce || !timestamp || !signature) {
            return res.status(401).json({
                error: 'S-401',
                message: 'Missing security headers (X-Nonce, X-TS, X-Sign)',
                code: 'invalid-signature'
            });
        }

        // Timestamp kontrolü
        const now = Date.now();
        const requestTime = parseInt(timestamp);

        if (isNaN(requestTime) || Math.abs(now - requestTime) > TIMESTAMP_TOLERANCE) {
            return res.status(403).json({
                error: 'S-403',
                message: 'Request timestamp is too old or invalid',
                code: 'stale-timestamp'
            });
        }

        // Nonce replay kontrolü
        if (nonceCache.has(nonce)) {
            return res.status(402).json({
                error: 'S-402',
                message: 'Nonce already used (replay attack detected)',
                code: 'replay-detected'
            });
        }

        // İmza doğrulama
        const bodyString = JSON.stringify(req.body);
        const dataToSign = `${nonce}.${timestamp}.${bodyString}`;
        const secret = process.env.HMAC_SECRET || 'default-hmac-secret-key';

        const expectedSignature = encryption.createHMAC(dataToSign, secret);

        if (!encryption.verifyHMAC(dataToSign, signature, secret)) {
            return res.status(401).json({
                error: 'S-401',
                message: 'Invalid signature',
                code: 'invalid-signature'
            });
        }

        // Nonce'u cache'e ekle
        nonceCache.set(nonce, now);

        // Request'e güvenlik bilgilerini ekle
        req.security = {
            nonce,
            timestamp: requestTime,
            signature
        };

        next();
    } catch (error) {
        console.error('Replay protection error:', error);
        return res.status(500).json({
            error: 'S-500',
            message: 'Security validation failed',
            code: 'security-error'
        });
    }
};

module.exports = replayProtection;
