const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const contactosCtrl = require('../controllers/contactosController');
const refrigeradoresCtrl = require('../controllers/refrigeradoresController');

const router = express.Router();

router.put('/contactos/:id', requireAuth, requireRole('Admin'), contactosCtrl.actualizar);
router.delete('/contactos/:id', requireAuth, requireRole('Admin'), contactosCtrl.desactivar);

router.put('/refrigeradores/:id', requireAuth, requireRole('Admin'), refrigeradoresCtrl.actualizar);
router.delete('/refrigeradores/:id', requireAuth, requireRole('Admin'), refrigeradoresCtrl.desactivar);

module.exports = router;
