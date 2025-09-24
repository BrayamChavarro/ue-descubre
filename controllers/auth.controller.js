const { authenticate, bootstrapDefaultAdmin } = require('../services/auth.service');
const { signAccess, signRefresh } = require('../utils/jwt');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

// Bootstrap admin lazily on first login attempt
let bootstrapped = false;

async function login(req, res, next) {
  try {
    if (!bootstrapped) { await bootstrapDefaultAdmin(); bootstrapped = true; }
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Username y password son requeridos' });
    const result = await authenticate(username, password);
    if (result === null || result === false) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
    // Sesión (backward compatibility)
    if (req.session) {
      req.session.adminId = result._id;
      req.session.adminUsername = result.username;
      req.session.adminRole = result.role;
    }
    // JWT tokens
    const accessToken = signAccess({ sub: result._id.toString(), username: result.username, role: result.role });
    const refreshToken = signRefresh({ sub: result._id.toString(), type: 'refresh' });
    return res.json({ success: true, message: 'Login exitoso', data: { username: result.username, role: result.role, lastLogin: result.lastLogin }, tokens: { accessToken, refreshToken } });
  } catch (err) { next(err); }
}

function logout(req, res) {
  req.session.destroy(() => {
    res.json({ success: true, message: 'Sesión cerrada exitosamente' });
  });
}

function verify(req, res) {
  if (req.session && req.session.adminId) {
    return res.json({ success: true, authenticated: true, data: { username: req.session.adminUsername, role: req.session.adminRole } });
  }
  return res.json({ success: true, authenticated: false });
}
function refresh(req, res) {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ success: false, message: 'refreshToken requerido' });
  try {
    const payload = jwt.verify(refreshToken, config.SESSION_SECRET);
    if (payload.type !== 'refresh') return res.status(401).json({ success: false, message: 'Token inválido' });
    const newAccess = signAccess({ sub: payload.sub });
    return res.json({ success: true, accessToken: newAccess });
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Refresh token no válido' });
  }
}

module.exports = { login, logout, verify, refresh };
