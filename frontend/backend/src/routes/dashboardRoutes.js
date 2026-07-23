const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/dashboardController');

const router = express.Router();

router.get('/ventas-hoy', requireAuth, requireRole('Admin'), ctrl.ventasHoy);
router.get('/por-vehiculo', requireAuth, requireRole('Admin'), ctrl.porVehiculo);
router.get('/por-producto', requireAuth, requireRole('Admin'), ctrl.porProducto);
router.get('/por-cliente', requireAuth, requireRole('Admin'), ctrl.porCliente);
router.get('/tendencia', requireAuth, requireRole('Admin'), ctrl.tendencia);
router.get('/mapa-calor', requireAuth, requireRole('Admin'), ctrl.mapaCalor);
router.get('/cortes-caja-hoy', requireAuth, requireRole('Admin'), ctrl.cortesCajaHoy);
router.get('/exportar-csv', requireAuth, requireRole('Admin'), ctrl.exportarCSV);

module.exports = router;
