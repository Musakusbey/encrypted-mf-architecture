const express = require('express');
const supabaseService = require('../services/supabaseService');

const router = express.Router();

// Kullanıcı girişi
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: 'Kullanıcı adı ve şifre gerekli',
                success: false
            });
        }

        const result = await supabaseService.loginUser({ username, password });
        res.json(result);

    } catch (error) {
        console.error('Giriş hatası:', error);
        res.status(500).json({
            error: error.message || 'Sunucu hatası',
            success: false
        });
    }
});

// Kullanıcı kaydı
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                error: 'Tüm alanlar gerekli',
                success: false
            });
        }

        const result = await supabaseService.registerUser({ username, email, password });
        res.status(201).json(result);

    } catch (error) {
        console.error('Kayıt hatası:', error);
        res.status(500).json({
            error: error.message || 'Sunucu hatası',
            success: false
        });
    }
});

// Token doğrulama
router.get('/verify', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            error: 'Token gerekli',
            valid: false
        });
    }

    try {
        const result = await supabaseService.verifyToken(token);
        res.json(result);
    } catch (error) {
        res.status(403).json({
            error: error.message || 'Geçersiz token',
            valid: false
        });
    }
});

module.exports = router;
