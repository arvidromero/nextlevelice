const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/clientesController');
const contactosCtrl = require('../controllers/contactosController');
const refrigeradoresCtrl = require('../controllers/refrigeradoresController');
const cuentasCtrl = require('../controllers/cuentasPorCobrarController');

const router = express.Router();

router.get('/', requireAuth, ctrl.listar);
router.get('/:id', requireAuth, ctrl.obtener);
router.post('/', requireAuth, requireRole('Admin'), ctrl.crear);
router.put('/:id', requireAuth, requireRole('Admin'), ctrl.actualizar);
router.delete('/:id', requireAuth, requireRole('Admin'), ctrl.desactivar);

// Contactos anidados: /api/clientes/:idCliente/contactos
router.get('/:idCliente/contactos', requireAuth, contactosCtrl.listarPorCliente);
router.post('/:idCliente/contactos', requireAuth, requireRole('Admin'), (req, res) => {
  req.body.idCliente = req.params.idCliente;
  contactosCtrl.crear(req, res);
});

// Refrigeradores anidados: /api/clientes/:idCliente/refrigeradores
router.get('/:idCliente/refrigeradores', requireAuth, refrigeradoresCtrl.listarPorCliente);
router.post('/:idCliente/refrigeradores', requireAuth, requireRole('Admin'), (req, res) => {
  req.body.idCliente = req.params.idCliente;
  refrigeradoresCtrl.crear(req, res);
});

// Cuenta por cobrar anidada: /api/clientes/:idCliente/cuenta y /abonos
router.get('/:idCliente/cuenta', requireAuth, requireRole('Admin'), cuentasCtrl.obtenerCuenta);
router.post('/:idCliente/abonos', requireAuth, requireRole('Admin'), cuentasCtrl.registrarAbono);

module.exports = router;
