const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const keyManagement = require('./keyManagement');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const AUDIT_LOG_FILE = path.join(__dirname, '../.logs/audit.log');

// Ensure log directory exists
if (!fs.existsSync(path.dirname(AUDIT_LOG_FILE))) {
    fs.mkdirSync(path.dirname(AUDIT_LOG_FILE), { recursive: true });
}

class AuditLogger {
    constructor() {
        this.lastHash = null;
        this.initializeChain();
    }

    // Zinciri başlat
    initializeChain() {
        try {
            if (fs.existsSync(AUDIT_LOG_FILE)) {
                const lines = fs.readFileSync(AUDIT_LOG_FILE, 'utf8')
                    .split('\n')
                    .filter(line => line.trim() !== '');

                if (lines.length > 0) {
                    const lastLine = JSON.parse(lines[lines.length - 1]);
                    this.lastHash = lastLine.hash;
                }
            }
        } catch (error) {
            console.error('Audit chain initialization error:', error);
        }
    }

    // Log entry oluştur
    createLogEntry(eventType, userId, details, ip = null, userAgent = null) {
        const timestamp = new Date().toISOString();
        const content = {
            eventType,
            userId,
            details,
            ip,
            userAgent,
            timestamp
        };

        // Hash hesapla
        const contentString = JSON.stringify(content);
        const hash = this.calculateHash(contentString);

        const logEntry = {
            id: crypto.randomUUID(),
            ...content,
            hash,
            prev_hash: this.lastHash,
            created_at: timestamp
        };

        // Zinciri güncelle
        this.lastHash = hash;

        return logEntry;
    }

    // Hash hesapla
    calculateHash(content) {
        const data = (this.lastHash || 'genesis') + content;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    // Log'u şifrele
    encryptLog(logEntry) {
        const key = keyManagement.getActiveKey();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipherGCM('aes-256-gcm', Buffer.from(key, 'hex'), iv);
        cipher.setAAD(Buffer.from('audit-log', 'utf8'));

        let encrypted = cipher.update(JSON.stringify(logEntry), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();

        // HMAC imza oluştur
        const hmac = crypto.createHmac('sha256', Buffer.from(key, 'hex'));
        hmac.update(encrypted);
        hmac.update(iv.toString('hex'));
        hmac.update(authTag.toString('hex'));
        const signature = hmac.digest('hex');

        return {
            iv: iv.toString('hex'),
            encryptedData: encrypted,
            authTag: authTag.toString('hex'),
            signature: signature,
            timestamp: new Date().toISOString()
        };
    }

    // Log'u çöz
    decryptLog(encryptedLog) {
        try {
            const { iv, encryptedData, authTag, signature } = encryptedLog;
            const key = keyManagement.getActiveKey();

            // HMAC doğrula
            const hmac = crypto.createHmac('sha256', Buffer.from(key, 'hex'));
            hmac.update(encryptedData);
            hmac.update(iv);
            hmac.update(authTag);
            const expectedSignature = hmac.digest('hex');

            if (expectedSignature !== signature) {
                throw new Error('HMAC signature verification failed');
            }

            const decipher = crypto.createDecipherGCM('aes-256-gcm', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
            decipher.setAAD(Buffer.from('audit-log', 'utf8'));
            decipher.setAuthTag(Buffer.from(authTag, 'hex'));

            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return JSON.parse(decrypted);
        } catch (error) {
            console.error('Audit log decryption failed:', error);
            return null;
        }
    }

    // Log kaydet
    async logEvent(eventType, userId, details, ip = null, userAgent = null) {
        try {
            const logEntry = this.createLogEntry(eventType, userId, details, ip, userAgent);
            const encryptedLog = this.encryptLog(logEntry);

            // Dosyaya yaz
            fs.appendFileSync(AUDIT_LOG_FILE, JSON.stringify(encryptedLog) + '\n');

            // Veritabanına da kaydet
            const { error: dbError } = await supabase
                .from('audit_logs')
                .insert([{
                    user_id: userId,
                    action: eventType,
                    resource: details.resource || 'system',
                    details: details,
                    ip_address: ip,
                    user_agent: userAgent,
                    hash: logEntry.hash,
                    prev_hash: logEntry.prev_hash
                }]);

            if (dbError) {
                console.error('Database audit log error:', dbError);
            }

            console.log(`Audit Log: ${eventType} - ${userId}`);
            return logEntry.id;
        } catch (error) {
            console.error('Audit logging error:', error);
            throw error;
        }
    }

    // Log'ları getir
    async getAuditLogs(limit = 50, userId = null) {
        try {
            let query = supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (userId) {
                query = query.eq('user_id', userId);
            }

            const { data: logs, error } = await query;

            if (error) {
                throw new Error(`Audit logs alınamadı: ${error.message}`);
            }

            return logs;
        } catch (error) {
            console.error('Get audit logs error:', error);
            throw error;
        }
    }

    // Zincir bütünlüğünü doğrula
    async verifyChainIntegrity() {
        try {
            const { data: logs, error } = await supabase
                .from('audit_logs')
                .select('id, hash, prev_hash, created_at')
                .order('created_at', { ascending: true });

            if (error) {
                throw new Error(`Zincir doğrulaması yapılamadı: ${error.message}`);
            }

            let isValid = true;
            let lastHash = null;
            const issues = [];

            for (let i = 0; i < logs.length; i++) {
                const log = logs[i];

                // İlk log için genesis hash kontrolü
                if (i === 0) {
                    if (log.prev_hash !== null) {
                        issues.push(`İlk log prev_hash null olmalı: ${log.id}`);
                        isValid = false;
                    }
                } else {
                    // Önceki hash kontrolü
                    if (log.prev_hash !== lastHash) {
                        issues.push(`Hash zinciri bozuk: ${log.id} (beklenen: ${lastHash}, bulunan: ${log.prev_hash})`);
                        isValid = false;
                    }
                }

                // Mevcut hash kontrolü
                const expectedHash = this.calculateHash(JSON.stringify({
                    eventType: log.action,
                    userId: log.user_id,
                    details: log.details,
                    timestamp: log.created_at
                }));

                if (log.hash !== expectedHash) {
                    issues.push(`Hash doğrulaması başarısız: ${log.id}`);
                    isValid = false;
                }

                lastHash = log.hash;
            }

            return {
                isValid,
                totalLogs: logs.length,
                issues,
                lastVerifiedHash: lastHash
            };
        } catch (error) {
            console.error('Chain integrity verification error:', error);
            return {
                isValid: false,
                totalLogs: 0,
                issues: [error.message],
                lastVerifiedHash: null
            };
        }
    }

    // Rapor oluştur
    async generateReport(startDate = null, endDate = null) {
        try {
            let query = supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: true });

            if (startDate) {
                query = query.gte('created_at', startDate);
            }
            if (endDate) {
                query = query.lte('created_at', endDate);
            }

            const { data: logs, error } = await query;

            if (error) {
                throw new Error(`Rapor oluşturulamadı: ${error.message}`);
            }

            // Zincir bütünlüğünü doğrula
            const integrityCheck = await this.verifyChainIntegrity();

            const report = {
                generatedAt: new Date().toISOString(),
                period: {
                    start: startDate || 'Başlangıç',
                    end: endDate || 'Şimdi'
                },
                statistics: {
                    totalLogs: logs.length,
                    uniqueUsers: new Set(logs.map(l => l.user_id)).size,
                    eventTypes: this.groupByEventType(logs)
                },
                integrity: {
                    isValid: integrityCheck.isValid,
                    totalLogs: integrityCheck.totalLogs,
                    issues: integrityCheck.issues,
                    lastVerifiedHash: integrityCheck.lastVerifiedHash
                },
                logs: logs.map(log => ({
                    id: log.id,
                    action: log.action,
                    userId: log.user_id,
                    resource: log.resource,
                    timestamp: log.created_at,
                    hash: log.hash,
                    prevHash: log.prev_hash
                }))
            };

            return report;
        } catch (error) {
            console.error('Report generation error:', error);
            throw error;
        }
    }

    // Event türlerine göre grupla
    groupByEventType(logs) {
        const groups = {};
        logs.forEach(log => {
            const action = log.action;
            groups[action] = (groups[action] || 0) + 1;
        });
        return groups;
    }

    // Güvenlik olaylarını getir
    async getSecurityEvents(limit = 20) {
        try {
            const { data: events, error } = await supabase
                .from('audit_logs')
                .select('*')
                .or('action.like.security%,action.like.auth%,action.like.replay%')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                throw new Error(`Güvenlik olayları alınamadı: ${error.message}`);
            }

            return events.map(event => ({
                id: event.id,
                type: this.getEventType(event.action),
                message: this.formatEventMessage(event),
                time: new Date(event.created_at).toLocaleTimeString(),
                module: event.resource || 'system',
                severity: this.getEventSeverity(event.action)
            }));
        } catch (error) {
            console.error('Get security events error:', error);
            throw error;
        }
    }

    getEventType(action) {
        if (action.includes('error') || action.includes('failed')) return 'error';
        if (action.includes('warning') || action.includes('blocked')) return 'warning';
        if (action.includes('success') || action.includes('completed')) return 'success';
        return 'info';
    }

    formatEventMessage(event) {
        const action = event.action;
        const details = event.details || {};

        switch (action) {
            case 'user.login':
                return `Kullanıcı giriş yaptı: ${details.username || event.user_id}`;
            case 'user.logout':
                return `Kullanıcı çıkış yaptı: ${details.username || event.user_id}`;
            case 'security.key.rotated':
                return 'Şifreleme anahtarı döndürüldü';
            case 'security.replay.blocked':
                return `Replay saldırısı engellendi: ${details.nonce || 'Bilinmeyen'}`;
            case 'security.invalid.signature':
                return 'Geçersiz imza tespit edildi';
            default:
                return `${action}: ${JSON.stringify(details)}`;
        }
    }

    getEventSeverity(action) {
        if (action.includes('replay') || action.includes('invalid')) return 'high';
        if (action.includes('key.rotated') || action.includes('auth')) return 'medium';
        return 'low';
    }
}

module.exports = new AuditLogger();