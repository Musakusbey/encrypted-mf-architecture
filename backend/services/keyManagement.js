const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class KeyManagementService {
    constructor() {
        this.keyRotationInterval = 24 * 60 * 60 * 1000; // 24 saat
        this.keys = new Map();
        this.keyHistory = [];
        this.init();
    }

    async init() {
        await this.loadKeys();
        this.startKeyRotation();
    }

    // Yeni anahtar oluştur
    generateKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Anahtar rotasyonu başlat
    startKeyRotation() {
        setInterval(async () => {
            await this.rotateKeys();
        }, this.keyRotationInterval);
    }

    // Anahtarları döndür
    async rotateKeys() {
        console.log('🔄 Anahtar rotasyonu başlatılıyor...');

        // Eski anahtarları geçmişe kaydet
        for (const [keyId, keyData] of this.keys) {
            this.keyHistory.push({
                keyId,
                key: keyData.key,
                createdAt: keyData.createdAt,
                rotatedAt: new Date().toISOString()
            });
        }

        // Yeni anahtarlar oluştur
        this.keys.clear();
        await this.generateNewKeys();
        await this.saveKeys();

        console.log('✅ Anahtar rotasyonu tamamlandı');
    }

    // Yeni anahtarlar oluştur
    async generateNewKeys() {
        const keyId = this.generateKeyId();
        const key = this.generateKey();

        this.keys.set(keyId, {
            key,
            createdAt: new Date().toISOString(),
            isActive: true
        });

        console.log(`🔑 Yeni anahtar oluşturuldu: ${keyId}`);
        return keyId;
    }

    // Anahtar ID oluştur
    generateKeyId() {
        return `key_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }

    // Aktif anahtarı al
    getActiveKey() {
        for (const [keyId, keyData] of this.keys) {
            if (keyData.isActive) {
                return { keyId, key: keyData.key };
            }
        }
        throw new Error('Aktif anahtar bulunamadı');
    }

    // Anahtarları dosyaya kaydet
    async saveKeys() {
        const keysDir = path.join(__dirname, '../keys');
        await fs.mkdir(keysDir, { recursive: true });

        const keysData = {
            keys: Object.fromEntries(this.keys),
            history: this.keyHistory.slice(-10) // Son 10 anahtarı sakla
        };

        await fs.writeFile(
            path.join(keysDir, 'keys.json'),
            JSON.stringify(keysData, null, 2)
        );
    }

    // Anahtarları dosyadan yükle
    async loadKeys() {
        try {
            const keysPath = path.join(__dirname, '../keys/keys.json');
            const keysData = JSON.parse(await fs.readFile(keysPath, 'utf8'));

            this.keys = new Map(Object.entries(keysData.keys || {}));
            this.keyHistory = keysData.history || [];

            console.log(`📁 ${this.keys.size} anahtar yüklendi`);
        } catch (error) {
            console.log('📁 Anahtar dosyası bulunamadı, yeni anahtarlar oluşturuluyor...');
            await this.generateNewKeys();
            await this.saveKeys();
        }
    }

    // Anahtar geçmişini al
    getKeyHistory() {
        return this.keyHistory;
    }

    // Anahtar istatistikleri
    getKeyStats() {
        return {
            activeKeys: this.keys.size,
            totalHistory: this.keyHistory.length,
            lastRotation: this.keyHistory.length > 0 ?
                this.keyHistory[this.keyHistory.length - 1].rotatedAt : null
        };
    }
}

module.exports = new KeyManagementService();
