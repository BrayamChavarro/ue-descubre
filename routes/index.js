const router = require('express').Router();
router.use('/auth', require('./auth.routes'));
router.use('/estudiantes', require('./estudiantes.routes'));
router.use('/estadisticas', require('./estadisticas.routes'));
module.exports = router;
