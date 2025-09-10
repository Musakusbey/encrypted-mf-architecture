const client = require('prom-client');

// Registry oluştur
const register = new client.Registry();

// Default metrics'leri ekle
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

const httpRequestErrors = new client.Counter({
    name: 'http_request_errors_total',
    help: 'Total number of HTTP request errors',
    labelNames: ['method', 'route', 'error_type']
});

const replayAttacksBlocked = new client.Counter({
    name: 'replay_attacks_blocked_total',
    help: 'Total number of replay attacks blocked',
    labelNames: ['attack_type']
});

const keyRotations = new client.Counter({
    name: 'key_rotations_total',
    help: 'Total number of key rotations',
    labelNames: ['key_type']
});

const activeSessions = new client.Gauge({
    name: 'active_sessions_total',
    help: 'Total number of active sessions'
});

const auditLogsTotal = new client.Counter({
    name: 'audit_logs_total',
    help: 'Total number of audit logs created',
    labelNames: ['log_type', 'severity']
});

const databaseConnections = new client.Gauge({
    name: 'database_connections_active',
    help: 'Number of active database connections'
});

const encryptionOperations = new client.Counter({
    name: 'encryption_operations_total',
    help: 'Total number of encryption operations',
    labelNames: ['operation_type', 'key_id']
});

// Metrics'leri registry'e ekle
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(httpRequestErrors);
register.registerMetric(replayAttacksBlocked);
register.registerMetric(keyRotations);
register.registerMetric(activeSessions);
register.registerMetric(auditLogsTotal);
register.registerMetric(databaseConnections);
register.registerMetric(encryptionOperations);

class MetricsService {
    constructor() {
        this.startTime = Date.now();
    }

    // HTTP request metrics
    recordHttpRequest(method, route, statusCode, duration) {
        httpRequestDuration
            .labels(method, route, statusCode)
            .observe(duration);

        httpRequestTotal
            .labels(method, route, statusCode)
            .inc();

        if (statusCode >= 400) {
            httpRequestErrors
                .labels(method, route, this.getErrorType(statusCode))
                .inc();
        }
    }

    // Replay attack metrics
    recordReplayAttack(attackType = 'unknown') {
        replayAttacksBlocked
            .labels(attackType)
            .inc();
    }

    // Key rotation metrics
    recordKeyRotation(keyType = 'aes') {
        keyRotations
            .labels(keyType)
            .inc();
    }

    // Session metrics
    updateActiveSessions(count) {
        activeSessions.set(count);
    }

    // Audit log metrics
    recordAuditLog(logType, severity = 'info') {
        auditLogsTotal
            .labels(logType, severity)
            .inc();
    }

    // Database connection metrics
    updateDatabaseConnections(count) {
        databaseConnections.set(count);
    }

    // Encryption operation metrics
    recordEncryptionOperation(operationType, keyId = 'unknown') {
        encryptionOperations
            .labels(operationType, keyId)
            .inc();
    }

    // Error type helper
    getErrorType(statusCode) {
        if (statusCode >= 500) return 'server_error';
        if (statusCode >= 400) return 'client_error';
        return 'unknown';
    }

    // Metrics endpoint
    async getMetrics() {
        return register.metrics();
    }

    // Health check metrics
    getHealthMetrics() {
        const uptime = (Date.now() - this.startTime) / 1000;
        return {
            uptime,
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        };
    }

    // Custom metrics oluştur
    createCustomCounter(name, help, labelNames = []) {
        const counter = new client.Counter({
            name,
            help,
            labelNames
        });
        register.registerMetric(counter);
        return counter;
    }

    createCustomGauge(name, help, labelNames = []) {
        const gauge = new client.Gauge({
            name,
            help,
            labelNames
        });
        register.registerMetric(gauge);
        return gauge;
    }

    createCustomHistogram(name, help, labelNames = [], buckets = [0.1, 0.5, 1, 2, 5]) {
        const histogram = new client.Histogram({
            name,
            help,
            labelNames,
            buckets
        });
        register.registerMetric(histogram);
        return histogram;
    }
}

module.exports = new MetricsService();
