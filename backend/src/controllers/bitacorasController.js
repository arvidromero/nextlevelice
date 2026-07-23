const prisma = require('../config/db');

// GET /api/bitacoras?idVehiculo=VH001&fecha=2026-07-22
async function listar(req, res) {
  const { idVehiculo, fecha } = req.query;
  const bitacoras = await prisma.bitacora.findMany({
    where: {
      ...(idVehiculo ? { idVehiculo } : {}),
      ...(fecha ? { fecha: new Date(fecha) } : {}),
    },
    orderBy: { fecha: 'desc' },
    take: 100,
  });
  res.json(bitacoras);
}

// GET /api/bitacoras/activa -- la bitacora mas reciente sin cerrar del chofer
async function obtenerActiva(req, res) {
  const bitacora = await prisma.bitacora.findFirst({
    where: { idChofer: req.usuario.email, estado: { not: 'Cerrada' } },
    orderBy: { fhSalida: 'desc' },
  });
  if (!bitacora) return res.status(404).json({ error: 'No tienes bitacora abierta hoy' });
  res.json(bitacora);
}

// POST /api/bitacoras  -- el chofer llena su checklist matutino
// body: { idVehiculo, odometroInicial, odometroImagen?, varillaAntes?, liquidoFrenos?, liquidoDireccion? }
async function crear(req, res) {
  const { idVehiculo, odometroInicial, odometroImagen, varillaAntes, liquidoFrenos, liquidoDireccion } = req.body;
  if (!idVehiculo || odometroInicial == null) {
    return res.status(400).json({ error: 'idVehiculo y odometroInicial son requeridos' });
  }

  const nueva = await prisma.bitacora.create({
    data: {
      idVehiculo,
      idChofer: req.usuario.email,
      odometroInicial, odometroImagen, varillaAntes, liquidoFrenos, liquidoDireccion,
      fhSalida: new Date(),
      estado: 'PendienteVoBo',
    },
  });
  res.status(201).json(nueva);
}

// PATCH /api/bitacoras/:id/aprobar  (solo Admin -- da el VoBo)
async function aprobar(req, res) {
  const bitacora = await prisma.bitacora.findUnique({ where: { idBitacora: req.params.id } });
  if (!bitacora) return res.status(404).json({ error: 'Bitacora no encontrada' });
  if (bitacora.estado !== 'PendienteVoBo') {
    return res.status(400).json({ error: `No se puede aprobar una bitacora en estado ${bitacora.estado}` });
  }

  const actualizada = await prisma.bitacora.update({
    where: { idBitacora: req.params.id },
    data: { estado: 'EnOperacion', usuarioAprobo: req.usuario.email, fhAprobacion: new Date() },
  });
  res.json(actualizada);
}

// PATCH /api/bitacoras/:id/cerrar  (el chofer cierra su dia)
// body: { odometroFinal, varillaDespues? }
async function cerrar(req, res) {
  const { odometroFinal, varillaDespues } = req.body;
  if (odometroFinal == null) return res.status(400).json({ error: 'odometroFinal es requerido' });

  const bitacora = await prisma.bitacora.findUnique({ where: { idBitacora: req.params.id } });
  if (!bitacora) return res.status(404).json({ error: 'Bitacora no encontrada' });
  if (bitacora.estado !== 'EnOperacion') {
    return res.status(400).json({ error: `No se puede cerrar una bitacora en estado ${bitacora.estado}` });
  }

  const cerrada = await prisma.bitacora.update({
    where: { idBitacora: req.params.id },
    data: { estado: 'Cerrada', odometroFinal, varillaDespues, fhLlegada: new Date() },
  });

  // Actualizamos el odometro del vehiculo con el ultimo valor conocido
  await prisma.vehiculo.update({ where: { idVehiculo: bitacora.idVehiculo }, data: { odometroActual: odometroFinal } });

  res.json(cerrada);
}

// GET /api/bitacoras/:id/corte-caja
async function corteCaja(req, res) {
  const rows = await prisma.$queryRaw`SELECT * FROM vw_CorteCaja WHERE idBitacora = ${req.params.id}`;
  if (rows.length === 0) return res.status(404).json({ error: 'Bitacora no encontrada' });
  res.json(rows[0]);
}

module.exports = { listar, obtenerActiva, crear, aprobar, cerrar, corteCaja };
