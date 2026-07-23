const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/ubicacionActualController');

const router = express.Router();

router.post('/', requireAuth, ctrl.actualizar);
router.get('/', requireAuth, ctrl.listar);
router.get('/resumen', requireAuth, requireRole('Admin'), ctrl.resumen);

module.exports = router;
