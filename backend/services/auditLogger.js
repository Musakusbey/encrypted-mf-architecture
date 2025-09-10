const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const keyManagement = require('./keyManagement');

class AuditLogger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs/audit');
        this.init();
    }

    async init() {
        await fs.mkdir(this.logDir, { recursive: true });
    }

    // Audit log oluştur
    async log(action, userId, details = {}) {
        const auditEntry = {
            id: this.generateLogId(),
            timestamp: new Date().toISOString(),
            action,
            userId,
            details,
            ip: details.ip || 'unknown',
            userAgent: details.userAgent || 'unknown',
            module: details.module || 'unknown'
        };

        // Log'u imzala
        auditEntry.signature = this.signLog(auditEntry);

        // Log'u şifrele
        const encryptedLog = this.encryptLog(auditEntry);

        // Dosyaya yaz
        await this.writeToFile(encryptedLog);

        console.log(`📝 Audit log: ${action} by ${userId}`);
    }

    // Log'u imzala
    signLog(logEntry) {
        const { key } = keyManagement.getActiveKey();
        const logString = JSON.stringify({
            id: logEntry.id,
            timestamp: logEntry.timestamp,
            action: logEntry.action,
            userId: logEntry.userId,
            details: logEntry.details
        });

        return crypto
            .createHmac('sha256', key)
            .update(logString)
            .digest('hex');
    }

    // Log'u şifrele
    encryptLog(logEntry) {
        const { key } = keyManagement.getActiveKey();
        const logString = JSON.stringify(logEntry);

        const cipher = crypto.createCipher('aes-256-cbc', key);
        let encrypted = cipher.update(logString, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return encrypted;
    }

    // Log'u çöz
    decryptLog(encryptedLog, key) {
        try {
            const decipher = crypto.createDecipher('aes-256-cbc', key);
            let decrypted = decipher.update(encryptedLog, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('Log çözme hatası:', error);
            return null;
        }
    }

    // Dosyaya yaz
    async writeToFile(encryptedLog) {
        const today = new Date().toISOString().split('T')[0];
        const logFile = path.join(this.logDir, `audit_${today}.log`);

        await fs.appendFile(logFile, encryptedLog + '\n');
    }

    // Log ID oluştur
    generateLogId() {
        return `audit_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }

    // Günlük logları oku
    async getTodayLogs() {
        const today = new Date().toISOString().split('T')[0];
        const logFile = path.join(this.logDir, `audit_${today}.log`);

        try {
            const content = await fs.readFile(logFile, 'utf8');
            const lines = content.trim().split('\n');

            const { key } = keyManagement.getActiveKey();
            const logs = [];

            for (const line of lines) {
                if (line.trim()) {
                    const decryptedLog = this.decryptLog(line, key);
                    if (decryptedLog) {
                        logs.push(decryptedLog);
                    }
                }
            }

            return logs;
        } catch (error) {
            console.error('Log okuma hatası:', error);
            return [];
        }
    }

    // Güvenlik olaylarını filtrele
    async getSecurityEvents() {
        const logs = await this.getTodayLogs();
        return logs.filter(log =>
            log.action.includes('login') ||
            log.action.includes('logout') ||
            log.action.includes('password') ||
            log.action.includes('security') ||
            log.action.includes('failed')
        );
    }

    // Kullanıcı aktivitelerini al
    async getUserActivity(userId) {
        const logs = await this.getTodayLogs();
        return logs.filter(log => log.userId === userId);
    }
}

module.exports = new AuditLogger();
