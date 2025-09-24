const jwt = require('jsonwebtoken');
const config = require('../config/env');

function jwtAuth(optional = false) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return optional ? next() : res.status(401).json({ success: false, message: 'Token requerido' });
    const [, token] = header.split(' ');
    if (!token) return res.status(401).json({ success: false, message: 'Token inválido' });
    try {
      const payload = jwt.verify(token, config.SESSION_SECRET);
      req.jwt = payload;
      return next();
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Token no válido' });
    }
  };
}

module.exports = { jwtAuth };
