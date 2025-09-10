const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const auditLogger = require('../services/auditLogger');
const keyManagement = require('../services/keyManagement');
const certificateManager = require('../services/certificateManager');

// Güvenlik dashboard verilerini al
router.get('/dashboard', async (req, res) => {
    try {
        const keyStats = keyManagement.getKeyStats();
        const certStats = await certificateManager.checkAllCertificates();
        const securityEvents = await auditLogger.getSecurityEvents();

        res.json({
            success: true,
            data: {
                keyStats,
                certStats: {
                    total: certStats.length,
                    valid: certStats.filter(c => c.isValid && !c.isExpired).length,
                    expired: certStats.filter(c => c.isExpired).length,
                    invalid: certStats.filter(c => !c.isValid).length
                },
                securityEvents: securityEvents.slice(0, 10) // Son 10 event
            }
        });
    } catch (error) {
        console.error('Güvenlik dashboard hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Güvenlik verileri alınamadı'
        });
    }
});

// Anahtar rotasyonunu manuel başlat
router.post('/rotate-keys', async (req, res) => {
    try {
        await keyManagement.rotateKeys();

        // Audit log
        await auditLogger.log('manual_key_rotation', 'system', {
            module: 'security',
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Anahtar rotasyonu başlatıldı'
        });
    } catch (error) {
        console.error('Anahtar rotasyon hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Anahtar rotasyonu başarısız'
        });
    }
});

// Sertifikaları yenile
router.post('/renew-certificates', async (req, res) => {
    try {
        const { serviceName } = req.body;

        if (serviceName) {
            await certificateManager.renewCertificate(serviceName);
        } else {
            // Tüm sertifikaları yenile
            const services = ['auth-service', 'user-service', 'module-service', 'audit-service'];
            for (const service of services) {
                await certificateManager.renewCertificate(service);
            }
        }

        // Audit log
        await auditLogger.log('certificate_renewal', 'system', {
            module: 'security',
            service: serviceName || 'all',
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Sertifikalar yenilendi'
        });
    } catch (error) {
        console.error('Sertifika yenileme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sertifika yenileme başarısız'
        });
    }
});

// Audit logları al
router.get('/audit-logs', async (req, res) => {
    try {
        const { userId, action, limit = 50 } = req.query;

        let logs;
        if (userId) {
            logs = await auditLogger.getUserActivity(userId);
        } else if (action) {
            const allLogs = await auditLogger.getTodayLogs();
            logs = allLogs.filter(log => log.action.includes(action));
        } else {
            logs = await auditLogger.getTodayLogs();
        }

        // Limit uygula
        logs = logs.slice(0, parseInt(limit));

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        console.error('Audit log alma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Audit logları alınamadı'
        });
    }
});

// Güvenlik olayı kaydet
router.post('/log-event', async (req, res) => {
    try {
        const { action, details } = req.body;

        await auditLogger.log(action, 'system', {
            ...details,
            module: 'security',
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Güvenlik olayı kaydedildi'
        });
    } catch (error) {
        console.error('Güvenlik olayı kaydetme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Güvenlik olayı kaydedilemedi'
        });
    }
});

// Sertifika durumunu kontrol et
router.get('/certificate-status', async (req, res) => {
    try {
        const certStatus = await certificateManager.checkAllCertificates();

        res.json({
            success: true,
            data: certStatus
        });
    } catch (error) {
        console.error('Sertifika durumu kontrol hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sertifika durumu kontrol edilemedi'
        });
    }
});

// Anahtar geçmişini al
router.get('/key-history', async (req, res) => {
    try {
        const keyHistory = keyManagement.getKeyHistory();

        res.json({
            success: true,
            data: keyHistory
        });
    } catch (error) {
        console.error('Anahtar geçmişi alma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Anahtar geçmişi alınamadı'
        });
    }
});

// Güvenlik raporu oluştur
router.get('/security-report', async (req, res) => {
    try {
        const keyStats = keyManagement.getKeyStats();
        const certStatus = await certificateManager.checkAllCertificates();
        const securityEvents = await auditLogger.getSecurityEvents();

        const report = {
            timestamp: new Date().toISOString(),
            keyManagement: keyStats,
            certificates: {
                total: certStatus.length,
                valid: certStatus.filter(c => c.isValid && !c.isExpired).length,
                expired: certStatus.filter(c => c.isExpired).length,
                invalid: certStatus.filter(c => !c.isValid).length,
                details: certStatus
            },
            securityEvents: {
                total: securityEvents.length,
                critical: securityEvents.filter(e => e.action.includes('failed') || e.action.includes('error')).length,
                recent: securityEvents.slice(0, 20)
            },
            recommendations: generateSecurityRecommendations(keyStats, certStatus, securityEvents)
        };

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Güvenlik raporu oluşturma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Güvenlik raporu oluşturulamadı'
        });
    }
});

// Güvenlik önerileri oluştur
function generateSecurityRecommendations(keyStats, certStatus, securityEvents) {
    const recommendations = [];

    // Anahtar rotasyonu önerisi
    if (keyStats.totalHistory > 0) {
        const lastRotation = new Date(keyStats.lastRotation);
        const daysSinceRotation = (Date.now() - lastRotation.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceRotation > 30) {
            recommendations.push({
                type: 'warning',
                title: 'Anahtar Rotasyonu Gerekli',
                description: 'Anahtarlar 30 günden fazla süredir değiştirilmedi. Güvenlik için rotasyon yapın.',
                priority: 'high'
            });
        }
    }

    // Sertifika süresi önerisi
    const expiredCerts = certStatus.filter(c => c.isExpired);
    if (expiredCerts.length > 0) {
        recommendations.push({
            type: 'critical',
            title: 'Süresi Dolmuş Sertifikalar',
            description: `${expiredCerts.length} sertifikanın süresi dolmuş. Hemen yenileyin.`,
            priority: 'critical'
        });
    }

    // Güvenlik olayları önerisi
    const criticalEvents = securityEvents.filter(e =>
        e.action.includes('failed') || e.action.includes('error')
    );
    if (criticalEvents.length > 5) {
        recommendations.push({
            type: 'warning',
            title: 'Yüksek Güvenlik Olayı Sayısı',
            description: 'Son 24 saatte çok sayıda güvenlik olayı tespit edildi. İnceleme yapın.',
            priority: 'medium'
        });
    }

    return recommendations;
}

module.exports = router;
