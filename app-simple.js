// Punto de entrada para Vercel (API Only) - Versión simple para debug
const express = require('express');

console.log('🚀 Iniciando aplicación...');

const app = express();
app.set('trust proxy', 1);

// Middleware básico
app.use(express.json({ limit: '200kb' }));

// Health check simple
app.get('/api/health', (req, res) => {
  console.log('📥 Health check solicitado');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0-debug'
  });
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando', path: req.path });
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
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: err.message
  });
});

console.log('✅ App inicializada correctamente');
module.exports = app;