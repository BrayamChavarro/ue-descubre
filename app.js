const express = require('express');
const session = require('express-session');
let MongoStore; // se carga condicionalmente
const cors = require('cors');
const cookieParser = require('cookie-parser');
const security = require('./middleware/security');
const config = require('./config/env');
const { connectToDatabase } = require('./config/db');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');
const { loginLimiter } = require('./middleware/rateLimit');

const app = express();
// Trust proxy needed for secure cookies behind Vercel/Netlify/CDN
app.set('trust proxy', 1);

// Core middleware
app.use(cors({ origin: true, credentials: true }));
security(app); // helmet + body limit
app.use(cookieParser());
// express.json ya aplicado dentro de security; se mantiene por compat if needed
app.use(requestLogger);

// Session (persistente usando Mongo si es posible). Fallback a memory-store si falla.
let sessionStore;
try {
  MongoStore = require('connect-mongo');
  sessionStore = MongoStore.create({
    mongoUrl: config.MONGODB_URI,
    dbName: config.DB_NAME,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60 // 1 día en segundos
  });
  // Nota: connect-mongo maneja reconexiones internamente.
  console.log('🗄️  Session store Mongo habilitado');
} catch (err) {
  console.warn('⚠️  No se pudo inicializar connect-mongo, usando memory store (NO recomendado en producción):', err.message);
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

// DB connection (warm up)
connectToDatabase().catch(err => {
  console.error('❌ Error inicializando conexión a MongoDB:', err.message);
});

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), env: config.NODE_ENV });
});

// Attach rate limiter for login specifically (controller route will use path /api/auth/login)
app.use('/api/auth/login', loginLimiter);

// API routes
app.use('/api', routes);

// 404 handler (after routes, before error handler)
app.use((req, res, next) => {
  if (res.headersSent) return next();
  res.status(404).json({ success: false, message: 'Recurso no encontrado' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
