const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// OpenTelemetry SDK'yi başlat
const sdk = new NodeSDK({
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'microfrontend-backend',
        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    }),
    instrumentations: [getNodeAutoInstrumentations()],
});

// SDK'yi başlat
sdk.start();

console.log('📊 OpenTelemetry initialized');

// Trace ID'yi response header'a ekle
const addTraceId = (req, res, next) => {
    const traceId = req.traceId || 'unknown';
    res.setHeader('X-Trace-Id', traceId);
    next();
};

module.exports = {
    addTraceId
};
