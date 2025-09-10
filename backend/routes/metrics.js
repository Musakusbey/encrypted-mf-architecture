const express = require('express');
const metricsService = require('../services/metricsService');
const router = express.Router();

// Prometheus metrics endpoint
router.get('/metrics', async (req, res) => {
    try {
        const metrics = await metricsService.getMetrics();
        res.set('Content-Type', 'text/plain');
        res.send(metrics);
    } catch (error) {
        console.error('Metrics endpoint error:', error);
        res.status(500).json({ error: 'Metrics alınamadı' });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    try {
        const healthData = metricsService.getHealthMetrics();
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: healthData.uptime,
            version: healthData.version,
            environment: healthData.environment
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// Custom metrics endpoint
router.get('/custom', async (req, res) => {
    try {
        const customMetrics = {
            keyStats: require('../config/keyStore').getKeyStats(),
            sessionStats: await require('../services/sessionService').getSessionStats(),
            auditStats: await require('../services/auditLogger').getAuditLogs(10)
        };

        res.json(customMetrics);
    } catch (error) {
        console.error('Custom metrics error:', error);
        res.status(500).json({ error: 'Custom metrics alınamadı' });
    }
});

module.exports = router;
