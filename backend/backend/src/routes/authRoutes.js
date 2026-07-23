const express = require('express');
const { loginAdmin, loginChofer } = require('../controllers/authController');

const router = express.Router();

router.post('/login-admin', loginAdmin);
router.post('/login-chofer', loginChofer);

module.exports = router;
