const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/promocionesController');

const router = express.Router();

router.get('/', requireAuth, ctrl.listar);
router.post('/', requireAuth, requireRole('Admin'), ctrl.crear);
router.delete('/:id', requireAuth, requireRole('Admin'), ctrl.desactivar);

module.exports = router;
