const express = require('express');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// POST /api/uploads  -- multipart/form-data, campo "imagen"
router.post('/', requireAuth, upload.single('imagen'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibio ningun archivo' });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

module.exports = router;
