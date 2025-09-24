const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { jwtAuth } = require('../middleware/jwtAuth');

router.post('/login', ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/verify', ctrl.verify);
router.post('/refresh', ctrl.refresh);
router.get('/profile', jwtAuth(), (req, res) => {
	res.json({ success: true, data: { sub: req.jwt.sub, username: req.jwt.username, role: req.jwt.role } });
});

module.exports = router;
