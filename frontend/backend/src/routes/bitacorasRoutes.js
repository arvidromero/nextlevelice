const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/bitacorasController');
const extraCtrl = require('../controllers/operacionExtraController');
const reportesCtrl = require('../controllers/reportesController');

const router = express.Router();

router.get('/', requireAuth, requireRole('Admin'), ctrl.listar);
router.get('/activa', requireAuth, ctrl.obtenerActiva);
router.post('/', requireAuth, ctrl.crear);
router.patch('/:id/aprobar', requireAuth, requireRole('Admin'), ctrl.aprobar);
router.patch('/:id/cerrar', requireAuth, ctrl.cerrar);
router.get('/:id/corte-caja', requireAuth, ctrl.corteCaja);
router.get('/:id/reporte-pdf', requireAuth, reportesCtrl.reportePDF);

router.get('/:idBitacora/abastecimientos', requireAuth, extraCtrl.listarAbastecimientos);
router.post('/:idBitacora/abastecimientos', requireAuth, extraCtrl.crearAbastecimiento);

router.get('/:idBitacora/movimientos-extra', requireAuth, extraCtrl.listarMovimientosExtra);
router.post('/:idBitacora/movimientos-extra', requireAuth, extraCtrl.crearMovimientoExtra);

module.exports = router;
