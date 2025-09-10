const metricsService = require('../services/metricsService');

const metricsMiddleware = (req, res, next) => {
    const startTime = Date.now();

    // Response tamamlandığında metrics'i kaydet
    res.on('finish', () => {
        const duration = (Date.now() - startTime) / 1000;
        const method = req.method;
        const route = req.route ? req.route.path : req.path;
        const statusCode = res.statusCode;

        metricsService.recordHttpRequest(method, route, statusCode, duration);
    });

    next();
};

module.exports = metricsMiddleware;
