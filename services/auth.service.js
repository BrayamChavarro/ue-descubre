const Admin = require('../models/Admin');
const config = require('../config/env');

async function authenticate(username, password) {
  // Buscar por username o email
  const admin = await Admin.findOne({
    $or: [ { username }, { email: username } ],
    isActive: true
  });
  if (!admin) return null;

  const valid = await admin.comparePassword(password);
  if (!valid) {
    await admin.incLoginAttempts();
    return false; // credenciales inválidas
  }
  await admin.resetLoginAttempts();
  admin.lastLogin = new Date();
  await admin.save();
  return admin;
}

async function bootstrapDefaultAdmin() {
  const Admin = require('../models/Admin');
  const exists = await Admin.findOne({ username: config.ADMIN_USERNAME });
  if (!exists) {
    await Admin.create({ username: config.ADMIN_USERNAME, password: config.ADMIN_PASSWORD, email: `${config.ADMIN_USERNAME}@local`, isActive: true });
    console.log('👤 Admin por defecto creado');
  }
}

module.exports = { authenticate, bootstrapDefaultAdmin };
