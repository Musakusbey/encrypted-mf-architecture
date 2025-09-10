const express = require('express');
const { authenticateToken, handleEncryptedData, encryptResponse } = require('../middleware/auth');
const supabaseService = require('../services/supabaseService');

const router = express.Router();

// Tüm API route'ları için authentication ve encryption middleware'lerini uygula
router.use(authenticateToken);
router.use(handleEncryptedData);
router.use(encryptResponse);

// Kullanıcı profili
router.get('/profile', async (req, res) => {
    try {
        const result = await supabaseService.getUserProfile(req.user.userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: error.message || 'Profil bilgileri alınamadı',
            success: false
        });
    }
});

// Güvenli veri endpoint'i
router.post('/secure-data', (req, res) => {
    try {
        const { data, type } = req.body;

        if (!data) {
            return res.status(400).json({
                error: 'Veri gerekli',
                success: false
            });
        }

        // Veriyi işle
        const processedData = {
            originalData: data,
            processedAt: new Date().toISOString(),
            processedBy: req.user.username,
            type: type || 'unknown',
            hash: encryption.createHash(JSON.stringify(data))
        };

        res.json({
            success: true,
            message: 'Veri başarıyla işlendi',
            data: processedData
        });

    } catch (error) {
        console.error('Veri işleme hatası:', error);
        res.status(500).json({
            error: 'Veri işlenirken hata oluştu',
            success: false
        });
    }
});

// Mikrofrontend için modül bilgileri
router.get('/modules', async (req, res) => {
    try {
        const result = await supabaseService.getModules();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: error.message || 'Modül bilgileri alınamadı',
            success: false
        });
    }
});

// Sistem durumu
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0',
        environment: process.env.NODE_ENV
    });
});

// Şifreleme test endpoint'i
router.post('/encryption-test', (req, res) => {
    try {
        const { testData } = req.body;

        if (!testData) {
            return res.status(400).json({
                error: 'Test verisi gerekli',
                success: false
            });
        }

        // Veriyi şifrele ve çöz
        const encrypted = encryption.encryptJSON(testData);
        const decrypted = encryption.decryptJSON(encrypted);

        res.json({
            success: true,
            message: 'Şifreleme testi başarılı',
            originalData: testData,
            encryptedData: encrypted,
            decryptedData: decrypted,
            isMatch: JSON.stringify(testData) === JSON.stringify(decrypted)
        });

    } catch (error) {
        console.error('Şifreleme test hatası:', error);
        res.status(500).json({
            error: 'Şifreleme testi başarısız',
            success: false
        });
    }
});

module.exports = router;
