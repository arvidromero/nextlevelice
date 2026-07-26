const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/cuentasPorCobrarController');

const router = express.Router();

router.get('/', requireAuth, requireRole('Admin'), ctrl.listarConSaldo);

module.exports = router;
