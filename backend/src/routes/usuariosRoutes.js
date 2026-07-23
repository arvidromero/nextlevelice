const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/usuariosController');

const router = express.Router();

router.get('/', requireAuth, requireRole('Admin'), ctrl.listar);
router.post('/', requireAuth, requireRole('Admin'), ctrl.crear);
router.put('/:email', requireAuth, requireRole('Admin'), ctrl.actualizar);
router.delete('/:email', requireAuth, requireRole('Admin'), ctrl.desactivar);

module.exports = router;
