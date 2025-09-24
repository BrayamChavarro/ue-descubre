require('dotenv').config();

const required = ['MONGODB_URI', 'SESSION_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.warn('[config] Variables de entorno faltantes:', missing.join(', '));
}

module.exports = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/uempresarial',
  DB_NAME: process.env.DB_NAME || 'uempresarial',
  SESSION_SECRET: process.env.SESSION_SECRET || 'insecure_dev_secret_change',
  NODE_ENV: process.env.NODE_ENV || 'development',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  MONGO_CONNECT_RETRIES: parseInt(process.env.MONGO_CONNECT_RETRIES || '5'),
  MONGO_CONNECT_DELAY_MS: parseInt(process.env.MONGO_CONNECT_DELAY_MS || '2000')
};
