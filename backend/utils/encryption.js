const crypto = require('crypto');
const keyManager = require('../config/keyStore');

class EncryptionUtil {
    constructor() {
        this.algorithm = 'aes-256-gcm';
    }

    // Veriyi şifrele
    encrypt(text, keyId = null) {
        try {
            const keyMaterial = keyId ? keyManager.getKey(keyId) : keyManager.getActiveKey();
            if (!keyMaterial) {
                throw new Error('Şifreleme anahtarı bulunamadı');
            }

            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipherGCM(this.algorithm, Buffer.from(keyMaterial, 'hex'), iv);
            cipher.setAAD(Buffer.from('mikrofrontend', 'utf8'));

            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const authTag = cipher.getAuthTag();

            return {
                encrypted: encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex'),
                keyId: keyId || keyManager.getKeyStats().activeKeyId
            };
        } catch (error) {
            console.error('Şifreleme hatası:', error);
            throw new Error('Veri şifrelenemedi');
        }
    }

    // Veriyi çöz (dual-decrypt desteği ile)
    decrypt(encryptedData) {
        try {
            const { encrypted, iv, authTag, keyId } = encryptedData;

            // Önce belirtilen anahtarla dene
            if (keyId) {
                const keyMaterial = keyManager.getKey(keyId);
                if (keyMaterial) {
                    try {
                        return this.decryptWithKey(encrypted, iv, authTag, keyMaterial);
                    } catch (error) {
                        console.warn(`Anahtar ${keyId} ile şifre çözülemedi, diğer anahtarlarla deneniyor...`);
                    }
                }
            }

            // Dual-decrypt: Son 2 anahtarla dene
            const keys = keyManager.getKeysForDecryption();
            for (const [currentKeyId, keyMaterial] of Object.entries(keys)) {
                try {
                    const result = this.decryptWithKey(encrypted, iv, authTag, keyMaterial);
                    console.log(`Şifre ${currentKeyId} anahtarı ile çözüldü`);
                    return result;
                } catch (error) {
                    console.warn(`Anahtar ${currentKeyId} ile şifre çözülemedi`);
                }
            }

            throw new Error('Hiçbir anahtar ile şifre çözülemedi');
        } catch (error) {
            console.error('Şifre çözme hatası:', error);
            throw new Error('Veri çözülemedi');
        }
    }

    // Belirli bir anahtarla şifre çöz
    decryptWithKey(encrypted, iv, authTag, keyMaterial) {
        const decipher = crypto.createDecipherGCM(this.algorithm, Buffer.from(keyMaterial, 'hex'), Buffer.from(iv, 'hex'));
        decipher.setAAD(Buffer.from('mikrofrontend', 'utf8'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    // JSON verisini şifrele
    encryptJSON(data, keyId = null) {
        const jsonString = JSON.stringify(data);
        return this.encrypt(jsonString, keyId);
    }

    // Şifreli veriyi JSON olarak çöz
    decryptJSON(encryptedData) {
        const decryptedString = this.decrypt(encryptedData);
        return JSON.parse(decryptedString);
    }

    // Hash oluştur
    createHash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    // Rastgele token oluştur
    generateToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    // HMAC imza oluştur
    createHMAC(data, secret) {
        return crypto.createHmac('sha256', secret).update(data).digest('hex');
    }

    // HMAC doğrula
    verifyHMAC(data, signature, secret) {
        const expectedSignature = this.createHMAC(data, secret);
        return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
    }
}

module.exports = new EncryptionUtil();