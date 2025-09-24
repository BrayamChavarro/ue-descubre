#!/usr/bin/env node
// Script para recrear o resetear el admin sin tocar el código de la app.
// Uso:
//   node scripts/resetAdmin.js                (usa ADMIN_USERNAME / ADMIN_PASSWORD del .env)
//   NEW_ADMIN_PASSWORD=OtraPass node scripts/resetAdmin.js
// Salida: imprime el estado final.

require('dotenv').config();
const { connectToDatabase } = require('../config/db');
const config = require('../config/env');
const Admin = require('../models/Admin');

async function run() {
  try {
    await connectToDatabase();
    const username = config.ADMIN_USERNAME;
    const desiredPassword = process.env.NEW_ADMIN_PASSWORD || config.ADMIN_PASSWORD;
    let admin = await Admin.findOne({ username });
    if (!admin) {
      admin = await Admin.create({ username, password: desiredPassword, email: `${username}@local`, isActive: true });
      console.log(`✅ Admin creado: ${username}`);
    } else {
      admin.password = desiredPassword; // será hasheada en pre('save')
      await admin.save();
      console.log(`🔄 Password de admin actualizado: ${username}`);
    }
    console.log('Listo. Puedes intentar login nuevamente.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en resetAdmin:', err.message);
    process.exit(1);
  }
}

run();
