const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/ubicacionesController');

const router = express.Router();

router.get('/', requireAuth, ctrl.listar);
router.get('/:id', requireAuth, ctrl.obtener);
router.post('/', requireAuth, requireRole('Admin'), ctrl.crear);
router.put('/:id', requireAuth, requireRole('Admin'), ctrl.actualizar);
router.delete('/:id', requireAuth, requireRole('Admin'), ctrl.desactivar);

module.exports = router;
