const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/estudiantes.controller');
const { validate } = require('../middleware/validate');
const { registroEstudianteSchema } = require('../validators/estudiantes');

router.post('/registro', validate(registroEstudianteSchema), ctrl.registrar); // público con validación
router.get('/', auth, ctrl.listar);
router.get('/export/csv', auth, ctrl.exportCsv);
router.get('/export/xlsx', auth, ctrl.exportXlsx);
router.get('/:id', auth, ctrl.obtener);
router.delete('/:id', auth, ctrl.eliminar);

module.exports = router;
