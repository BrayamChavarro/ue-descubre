const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/estadisticas.controller');

router.get('/', auth, ctrl.estadisticas);

module.exports = router;
