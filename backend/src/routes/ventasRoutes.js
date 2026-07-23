const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/ventasController');

const router = express.Router();

router.get('/', requireAuth, ctrl.listar);
router.get('/:id', requireAuth, ctrl.obtener);
router.post('/', requireAuth, ctrl.crear); // cualquier usuario autenticado (el chofer vende)
router.post('/:id/cancelar', requireAuth, requireRole('Admin'), ctrl.cancelar);

module.exports = router;
