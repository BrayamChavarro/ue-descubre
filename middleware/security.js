const helmet = require('helmet');

function security(app) {
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  // Limitar tamaño de JSON
  app.use(require('express').json({ limit: '200kb' }));
}

module.exports = security;
