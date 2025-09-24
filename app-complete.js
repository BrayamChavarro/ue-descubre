// App.js completa con manejo robusto de errores
const express = require('express');

console.log('🚀 Iniciando aplicación completa...');

const app = express();
app.set('trust proxy', 1);

// Cargar configuración
let config;
try {
    config = require('./config/env');
    console.log('✅ Configuración cargada');
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

// Logger y Security
const { requestLogger } = require('./middleware/logger');
app.use(requestLogger);
const security = require('./middleware/security');
security(app);

// Sesiones
const session = require('express-session');
let sessionStore;

try {
    if (config.MONGODB_URI && config.MONGODB_URI !== 'mongodb://localhost:27017/uempresarial') {
        const MongoStore = require('connect-mongo');
        sessionStore = MongoStore.create({
            mongoUrl: config.MONGODB_URI,
            dbName: config.DB_NAME,
            collectionName: 'sessions',
            ttl: 24 * 60 * 60,
            touchAfter: 24 * 3600
        });
        console.log('✅ Session store MongoDB configurado');
    }
} catch (error) {
    console.warn('⚠️  Error configurando session store, usando memory store:', error.message);
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

// Conexión a DB (no bloqueante)
if (config.MONGODB_URI && config.MONGODB_URI !== 'mongodb://localhost:27017/uempresarial') {
    const { connectToDatabase } = require('./config/db');
    connectToDatabase().catch(err => {
        console.error('❌ Error conectando a MongoDB:', err.message);
        console.warn('⚠️  La aplicación continuará funcionando');
    });
}

// Health check
app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');
    const healthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        env: config.NODE_ENV,
        version: '1.0.0-complete',
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
try {
    const { loginLimiter } = require('./middleware/rateLimit');
    app.use('/api/auth/login', loginLimiter);
    console.log('✅ Rate limiter aplicado');
} catch (error) {
    console.warn('⚠️  Error aplicando rate limiter:', error.message);
}

// Rutas con manejo de errores
try {
    console.log('🔄 Cargando rutas...');
    const routes = require('./routes');
    app.use('/api', routes);
    console.log('✅ Rutas API cargadas exitosamente');
} catch (error) {
    console.error('❌ Error cargando rutas principales:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Fallback: cargar rutas individualmente
    console.log('🔄 Intentando cargar rutas individualmente...');
    
    try {
        const authRoutes = require('./routes/auth.routes');
        app.use('/api/auth', authRoutes);
        console.log('✅ Rutas auth cargadas');
    } catch (err) {
        console.error('❌ Error cargando rutas auth:', err.message);
        
        // Fallback auth simple
        app.post('/api/auth/login', (req, res) => {
            res.status(503).json({ 
                success: false, 
                message: 'Servicio de autenticación temporalmente no disponible',
                error: 'Auth routes loading failed'
            });
        });
    }
    
    try {
        const estudiantesRoutes = require('./routes/estudiantes.routes');
        app.use('/api/estudiantes', estudiantesRoutes);
        console.log('✅ Rutas estudiantes cargadas');
    } catch (err) {
        console.error('❌ Error cargando rutas estudiantes:', err.message);
        
        // Fallback estudiantes simple
        app.get('/api/estudiantes', (req, res) => {
            res.status(503).json({ 
                success: false, 
                message: 'Servicio de estudiantes temporalmente no disponible',
                error: 'Estudiantes routes loading failed'
            });
        });
    }
    
    try {
        const estadisticasRoutes = require('./routes/estadisticas.routes');
        app.use('/api/estadisticas', estadisticasRoutes);
        console.log('✅ Rutas estadísticas cargadas');
    } catch (err) {
        console.error('❌ Error cargando rutas estadísticas:', err.message);
    }
}

// Ruta raíz
app.get('/', (req, res) => {
    res.json({ 
        message: 'API Tu Futuro Dual - Versión completa', 
        version: '1.0.0-complete',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /api/health',
            'POST /api/auth/login',
            'GET /api/auth/verify',
            'POST /api/estudiantes/registro',
            'GET /api/estudiantes',
            'GET /api/estadisticas'
        ]
    });
});

// 404 handler
app.use((req, res, next) => {
    if (res.headersSent) return next();
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
    app.use((err, req, res, next) => {
        console.error('🔥 Error fallback:', err.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    });
}

console.log('✅ Aplicación completa inicializada');
module.exports = app;