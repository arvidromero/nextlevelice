const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/visitasController');

const router = express.Router();

router.get('/', requireAuth, requireRole('Admin'), ctrl.listarTodas);

module.exports = router;
