const express = require('express');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/ubicacionActualController');

const router = express.Router();

router.post('/', requireAuth, ctrl.actualizar);
router.get('/', requireAuth, ctrl.listar);

module.exports = router;
