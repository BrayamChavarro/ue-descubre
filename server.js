// Minimal bootstrap for local development. The real Express app is assembled in app.js
// This file remains as the entry point (package.json main & start script).

const app = require('./app');
const configEnv = require('./config/env');
const PORT = configEnv.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 API escuchando en http://localhost:${PORT} (NODE_ENV=${configEnv.NODE_ENV})`);
  });
}

module.exports = app;
