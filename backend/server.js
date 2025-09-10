const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: './config.env' });

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
// const securityRoutes = require('./routes/security');
const encryption = require('./utils/encryption');

const app = express();
const PORT = process.env.PORT || 3001;

// Güvenlik middleware'leri
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// CORS ayarları
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // Her IP için maksimum 100 istek
    message: {
        error: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin',
        encrypted: false
    }
});

app.use(limiter);

// Compression ve logging
app.use(compression());
app.use(morgan('combined'));

// Body parser middleware'leri
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ana route
app.get('/', (req, res) => {
    res.json({
        message: 'Mikrofrontend Backend API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/auth',
            api: '/api',
            health: '/api/health'
        }
    });
});

// API route'ları
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
// app.use('/api/security', securityRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint bulunamadı',
        path: req.originalUrl,
        method: req.method,
        encrypted: false
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global hata:', error);

    res.status(error.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Sunucu hatası'
            : error.message,
        success: false,
        encrypted: false
    });
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`🚀 Mikrofrontend Backend sunucusu ${PORT} portunda çalışıyor`);
    console.log(`📡 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
    console.log(`🔐 Şifreleme aktif: ${encryption ? 'Evet' : 'Hayır'}`);
    console.log(`🌍 Ortam: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Rate Limit: 100 istek/15 dakika`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM sinyali alındı, sunucu kapatılıyor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT sinyali alındı, sunucu kapatılıyor...');
    process.exit(0);
});

module.exports = app;
