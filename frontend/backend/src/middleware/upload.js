const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const nombreUnico = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, nombreUnico);
  },
});

function filtroImagenes(req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Solo se permiten archivos de imagen'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter: filtroImagenes,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
