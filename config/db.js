const mongoose = require('mongoose');
const config = require('./env');

let isConnected = false;
let attempts = 0;

function sanitizeUri(uri) {
  try {
    if (!uri) return '';
    const parts = uri.split('@');
    if (parts.length === 2) {
      // hide credentials before '@'
      const hostPart = parts[1];
      return '***:***@' + hostPart;
    }
    return uri;
  } catch { return '***'; }
}

async function connectOnce() {
  if (isConnected) return;
  if (process.env.DEBUG && process.env.DEBUG.includes('db')) {
    console.log(`[db] (Intento ${attempts + 1}) Conectando a ${sanitizeUri(config.MONGODB_URI)} db=${config.DB_NAME}`);
  }
  await mongoose.connect(config.MONGODB_URI, {
    dbName: config.DB_NAME,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    autoIndex: false
  });
  isConnected = true;
  console.log('✅ MongoDB conectado');
}

async function connectToDatabase() {
  if (isConnected) return;
  const max = config.MONGO_CONNECT_RETRIES;
  const delay = config.MONGO_CONNECT_DELAY_MS;
  while (!isConnected && attempts < max) {
    try {
      await connectOnce();
    } catch (err) {
      attempts++;
      if (/Authentication failed/i.test(err.message)) {
        console.error(`❌ Error conexión MongoDB (intento ${attempts}/${max}): autenticación fallida.`);
        console.error('   ▶ Revisa que el USUARIO y PASSWORD de la URI pertenezcan a un usuario de Mongo (NO confundir con ADMIN_USERNAME del sistema).');
        console.error('   ▶ Si es instancia local y no configuraste auth, arranca mongod sin --auth o crea un usuario:');
        console.error("      use uempresarial; db.createUser({user:'appuser', pwd:'TuPasswordSegura', roles:[{role:'readWrite', db:'uempresarial'}]})");
        console.error('   ▶ Luego usa: mongodb://appuser:TuPasswordSegura@localhost:27017/uempresarial?authSource=uempresarial');
      } else {
        console.error(`❌ Error conexión MongoDB (intento ${attempts}/${max}): ${err.message}`);
      }
      if (attempts >= max) {
        console.error('💥 Agotados los intentos de conexión a MongoDB');
        throw err;
      }
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB desconectado');
  isConnected = false;
});

module.exports = { connectToDatabase };
