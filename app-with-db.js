// App.js con conexión MongoDB para identificar problemas de DB
const express = require('express');

console.log('🚀 Iniciando aplicación con DB...');

const app = express();
app.set('trust proxy', 1);

// Cargar configuración primero
let config;
try {
    config = require('./config/env');
    console.log('✅ Configuración cargada');
    console.log('  - NODE_ENV:', config.NODE_ENV);
    console.log('  - MongoDB configurada:', !!(config.MONGODB_URI && config.MONGODB_URI !== 'mongodb://localhost:27017/uempresarial'));
} catch (error) {
    console.error('❌ Error cargando configuración:', error.message);
    throw error;
}

// Middleware básico
app.use(express.json({ limit: '200kb' }));
const cors = require('cors');
app.use(cors({ origin: true, credentials: true }));
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Logger
const { requestLogger } = require('./middleware/logger');
app.use(requestLogger);

// Security
const security = require('./middleware/security');
security(app);

// Sesiones con MongoDB store
const session = require('express-session');
let sessionStore;
let MongoStore;

try {
    if (config.MONGODB_URI && config.MONGODB_URI !== 'mongodb://localhost:27017/uempresarial') {
        console.log('🔄 Intentando cargar connect-mongo...');
        MongoStore = require('connect-mongo');
        console.log('✅ connect-mongo cargado');
        
        console.log('🔄 Creando session store...');
        sessionStore = MongoStore.create({
            mongoUrl: config.MONGODB_URI,
            dbName: config.DB_NAME,
            collectionName: 'sessions',
            ttl: 24 * 60 * 60,
            touchAfter: 24 * 3600
        });
        console.log('✅ Session store MongoDB creado');
    } else {
        console.warn('⚠️  MONGODB_URI no configurada, usando memory store');
    }
} catch (error) {
    console.error('❌ Error configurando session store:', error.message);
    console.warn('⚠️  Usando memory store como fallback');
    sessionStore = null;
}

app.use(session({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        secure: config.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000
    },
    proxy: config.NODE_ENV === 'production',
    name: 'sessionId'
}));

console.log('✅ Sessions configuradas');

// Conexión a DB (no bloqueante)
let dbConnected = false;
if (config.MONGODB_URI && config.MONGODB_URI !== 'mongodb://localhost:27017/uempresarial') {
    console.log('🔄 Inicializando conexión a MongoDB...');
    const { connectToDatabase } = require('./config/db');
    connectToDatabase()
        .then(() => {
            console.log('✅ MongoDB conectado exitosamente');
            dbConnected = true;
        })
        .catch(err => {
            console.error('❌ Error conectando a MongoDB:', err.message);
            console.warn('⚠️  La aplicación continuará sin DB');
        });
} else {
    console.warn('⚠️  MONGODB_URI no configurada, saltando conexión');
}

// Health check con info de DB
app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');
    const healthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        env: config.NODE_ENV,
        version: '1.0.0-with-db',
        mongodb: {
            configured: !!(config.MONGODB_URI && config.MONGODB_URI !== 'mongodb://localhost:27017/uempresarial'),
            connected: mongoose.connection.readyState === 1,
            state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown'
        },
        session: {
            store: sessionStore ? 'mongodb' : 'memory'
        }
    };
    res.json(healthData);
});

// Rate limiter
const { loginLimiter } = require('./middleware/rateLimit');
app.use('/api/auth/login', loginLimiter);

// Ruta básica
app.get('/', (req, res) => {
    res.json({ 
        message: 'API funcionando - versión con DB', 
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

// Login básico (sin controlador completo)
app.post('/api/auth/login', (req, res) => {
    const mongoose = require('mongoose');
    res.json({ 
        success: false, 
        message: 'Login básico - en desarrollo',
        dbConnected: mongoose.connection.readyState === 1,
        received: !!req.body,
        sessionId: req.sessionID
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
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

console.log('✅ App con DB inicializada correctamente');
module.exports = app;