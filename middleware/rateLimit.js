const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Demasiados intentos de login. Intenta más tarde.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { loginLimiter };
