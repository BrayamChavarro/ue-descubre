const jwt = require('jsonwebtoken');
const config = require('../config/env');

function signAccess(payload, opts = {}) {
  return jwt.sign(payload, config.SESSION_SECRET, { expiresIn: '15m', ...opts });
}

function signRefresh(payload, opts = {}) {
  return jwt.sign(payload, config.SESSION_SECRET, { expiresIn: '7d', ...opts });
}

module.exports = { signAccess, signRefresh };
