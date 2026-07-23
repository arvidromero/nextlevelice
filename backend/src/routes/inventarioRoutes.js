const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/inventarioController');

const router = express.Router();

// Consultas: cualquier usuario autenticado
router.get('/conceptos', requireAuth, ctrl.listarConceptos);
router.get('/existencias', requireAuth, ctrl.listarExistencias);
router.get('/kardex', requireAuth, ctrl.listarKardex);

// Movimientos: cualquier usuario autenticado puede registrar
// (el chofer necesita esto para vender, traspasar, cargar producción, etc.)
router.post('/movimientos', requireAuth, ctrl.registrarMovimiento);
router.post('/traspasos', requireAuth, ctrl.registrarTraspaso);

module.exports = router;
