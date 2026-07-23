const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/productosController');

const router = express.Router();

// Cualquier usuario autenticado puede consultar (Admin u Operador/chofer)
router.get('/', requireAuth, ctrl.listar);
router.get('/:id', requireAuth, ctrl.obtener);

// Solo Admin puede crear, editar o desactivar productos
router.post('/', requireAuth, requireRole('Admin'), ctrl.crear);
router.put('/:id', requireAuth, requireRole('Admin'), ctrl.actualizar);
router.delete('/:id', requireAuth, requireRole('Admin'), ctrl.desactivar);

module.exports = router;
