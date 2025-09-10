const jwt = require('jsonwebtoken');
const encryption = require('../utils/encryption');

// JWT token doğrulama middleware'i
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            error: 'Erişim token\'ı gerekli',
            encrypted: false
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token doğrulama hatası:', error);
        return res.status(403).json({
            error: 'Geçersiz token',
            encrypted: false
        });
    }
};

// Şifreli veri middleware'i
const handleEncryptedData = (req, res, next) => {
    if (req.body.encrypted) {
        try {
            const decryptedData = encryption.decryptJSON(req.body);
            req.body = decryptedData;
            req.isEncrypted = true;
        } catch (error) {
            console.error('Şifreli veri çözme hatası:', error);
            return res.status(400).json({
                error: 'Şifreli veri çözülemedi',
                encrypted: false
            });
        }
    }
    next();
};

// Yanıt şifreleme middleware'i
const encryptResponse = (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
        if (req.isEncrypted && typeof data === 'object') {
            try {
                const encryptedData = encryption.encryptJSON(data);
                originalSend.call(this, encryptedData);
            } catch (error) {
                console.error('Yanıt şifreleme hatası:', error);
                originalSend.call(this, data);
            }
        } else {
            originalSend.call(this, data);
        }
    };

    next();
};

// Token oluşturma fonksiyonu
const generateToken = (userData) => {
    return jwt.sign(
        {
            userId: userData.id,
            username: userData.username,
            role: userData.role || 'user',
            timestamp: Date.now()
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

module.exports = {
    authenticateToken,
    handleEncryptedData,
    encryptResponse,
    generateToken
};
