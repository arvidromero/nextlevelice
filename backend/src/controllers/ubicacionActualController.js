const prisma = require('../config/db');

// POST /api/ubicacion-actual
// body: { idVehiculo, latitud, longitud }
// Solo se acepta si el chofer tiene una bitacora EnOperacion para ese vehiculo hoy.
async function actualizar(req, res) {
  const { idVehiculo, latitud, longitud } = req.body;
  if (!idVehiculo || latitud == null || longitud == null) {
    return res.status(400).json({ error: 'idVehiculo, latitud y longitud son requeridos' });
  }

  const bitacoraActiva = await prisma.bitacora.findFirst({
    where: { idVehiculo, idChofer: req.usuario.email, estado: 'EnOperacion' },
  });
  if (!bitacoraActiva) {
    return res.status(403).json({ error: 'No tienes una operacion activa para este vehiculo hoy' });
  }

  const ubicacion = await prisma.ubicacionActual.upsert({
    where: { idVehiculo },
    create: { idVehiculo, idChofer: req.usuario.email, latitud, longitud },
    update: { idChofer: req.usuario.email, latitud, longitud, fechaHora: new Date() },
  });
  res.json(ubicacion);
}

// GET /api/ubicacion-actual  (para el mapa de Admin)
async function listar(req, res) {
  const ubicaciones = await prisma.ubicacionActual.findMany();
  res.json(ubicaciones);
}

module.exports = { actualizar, listar };
