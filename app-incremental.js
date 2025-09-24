// App.js incremental para identificar el componente problemático
const express = require('express');

console.log('🚀 Iniciando aplicación incremental...');

const app = express();
app.set('trust proxy', 1);

console.log('✅ Express app creada');

// 1. Middleware básico primero
try {
    app.use(express.json({ limit: '200kb' }));
    console.log('✅ express.json middleware cargado');
} catch (error) {
    console.error('❌ Error cargando express.json:', error.message);
}

// 2. CORS
try {
    const cors = require('cors');
    app.use(cors({ origin: true, credentials: true }));
    console.log('✅ CORS middleware cargado');
} catch (error) {
    console.error('❌ Error cargando CORS:', error.message);
}

// 3. Cookie parser
try {
    const cookieParser = require('cookie-parser');
    app.use(cookieParser());
    console.log('✅ Cookie parser cargado');
} catch (error) {
    console.error('❌ Error cargando cookie parser:', error.message);
}

// 4. Configuración
let config;
try {
    config = require('./config/env');
    console.log('✅ Configuración cargada');
    console.log('  - NODE_ENV:', config.NODE_ENV);
    console.log('  - MongoDB configurada:', !!(config.MONGODB_URI && config.MONGODB_URI !== 'mongodb://localhost:27017/uempresarial'));
} catch (error) {
    console.error('❌ Error cargando configuración:', error.message);
    // Fallback config
    config = {
        NODE_ENV: 'production',
        SESSION_SECRET: 'fallback_secret',
        MONGODB_URI: null
    };
}

// 5. Logger middleware
try {
    const { requestLogger } = require('./middleware/logger');
    app.use(requestLogger);
    console.log('✅ Request logger cargado');
} catch (error) {
    console.error('❌ Error cargando request logger:', error.message);
}

// 6. Security middleware
try {
    const security = require('./middleware/security');
    security(app);
    console.log('✅ Security middleware cargado');
} catch (error) {
    console.error('❌ Error cargando security middleware:', error.message);
}

// 7. Sesiones (sin MongoDB primero)
try {
    const session = require('express-session');
    app.use(session({
        secret: config.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: config.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000
        },
        proxy: config.NODE_ENV === 'production',
        name: 'sessionId'
    }));
    console.log('✅ Sessions middleware cargado (memory store)');
} catch (error) {
    console.error('❌ Error cargando sessions:', error.message);
}

// Health check mejorado
app.get('/api/health', (req, res) => {
    console.log('📥 Health check solicitado');
    const healthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        env: config.NODE_ENV,
        version: '1.0.0-incremental',
        components: {
            express: true,
            cors: true,
            cookieParser: true,
            config: true,
            logger: true,
            security: true,
            sessions: true
        }
    };
    res.json(healthData);
});

// 8. Rate limiter (solo para login)
try {
    const { loginLimiter } = require('./middleware/rateLimit');
    app.use('/api/auth/login', loginLimiter);
    console.log('✅ Rate limiter cargado');
} catch (error) {
    console.error('❌ Error cargando rate limiter:', error.message);
}

// 9. Rutas básicas sin DB
app.get('/', (req, res) => {
    res.json({ 
        message: 'API funcionando - versión incremental', 
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

// Ruta de prueba para auth (sin DB)
app.post('/api/auth/login', (req, res) => {
    console.log('📥 Login intento (sin DB)');
    res.json({ 
        success: false, 
        message: 'DB no conectada - modo prueba',
        received: !!req.body
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Recurso no encontrado',
        path: req.path 
    });
});

// Error handler
try {
    const errorHandler = require('./middleware/errorHandler');
    app.use(errorHandler);
    console.log('✅ Error handler cargado');
} catch (error) {
    console.error('❌ Error cargando error handler:', error.message);
    // Fallback error handler
    app.use((err, req, res, next) => {
        console.error('🔥 Error fallback:', err.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: err.message
        });
    });
}

console.log('✅ App incremental inicializada correctamente');
module.exports = app;