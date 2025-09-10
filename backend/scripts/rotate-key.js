#!/usr/bin/env node

const keyManager = require('../config/keyStore');

console.log('🔐 Anahtar rotasyonu başlatılıyor...');

try {
    const stats = keyManager.getKeyStats();
    console.log(`Mevcut aktif anahtar: ${stats.activeKeyId}`);
    console.log(`Toplam anahtar sayısı: ${stats.totalKeys}`);

    const newKeyId = keyManager.rotateKey();
    const newStats = keyManager.getKeyStats();

    console.log('✅ Anahtar rotasyonu tamamlandı!');
    console.log(`Yeni aktif anahtar: ${newKeyId}`);
    console.log(`Yeni toplam anahtar sayısı: ${newStats.totalKeys}`);
    console.log(`Son rotasyon zamanı: ${new Date(newStats.lastRotation).toLocaleString()}`);

} catch (error) {
    console.error('❌ Anahtar rotasyonu başarısız:', error.message);
    process.exit(1);
}
