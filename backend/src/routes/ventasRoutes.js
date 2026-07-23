const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/ventasController');
const ticketsCtrl = require('../controllers/ticketsController');

const router = express.Router();

router.get('/', requireAuth, ctrl.listar);
router.get('/:id', requireAuth, ctrl.obtener);
router.get('/:id/ticket-pdf', requireAuth, ticketsCtrl.ticketPDF);
router.post('/', requireAuth, ctrl.crear); // cualquier usuario autenticado (el chofer vende)
router.post('/:id/cancelar', requireAuth, requireRole('Admin'), ctrl.cancelar);

module.exports = router;
