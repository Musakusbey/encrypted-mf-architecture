const crypto = require('crypto');

class EncryptionUtil {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.key = Buffer.from(process.env.ENCRYPTION_KEY || 'mikrofrontend_encryption_key_32_chars', 'utf8');
    }

    // Veriyi şifrele
    encrypt(text) {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipherGCM(this.algorithm, this.key, iv);
            cipher.setAAD(Buffer.from('mikrofrontend', 'utf8'));

            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const authTag = cipher.getAuthTag();

            return {
                encrypted: encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex')
            };
        } catch (error) {
            console.error('Şifreleme hatası:', error);
            throw new Error('Veri şifrelenemedi');
        }
    }

    // Veriyi çöz
    decrypt(encryptedData) {
        try {
            const decipher = crypto.createDecipherGCM(this.algorithm, this.key, Buffer.from(encryptedData.iv, 'hex'));
            decipher.setAAD(Buffer.from('mikrofrontend', 'utf8'));
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            console.error('Şifre çözme hatası:', error);
            throw new Error('Veri çözülemedi');
        }
    }

    // JSON verisini şifrele
    encryptJSON(data) {
        const jsonString = JSON.stringify(data);
        return this.encrypt(jsonString);
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
}

module.exports = new EncryptionUtil();
