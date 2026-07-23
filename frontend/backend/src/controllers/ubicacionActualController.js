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

// GET /api/ubicacion-actual/resumen -- para el mapa en tiempo real:
// posicion + existencia total + ventas de hoy por cada camioneta
async function resumen(req, res) {
  const ubicaciones = await prisma.ubicacionActual.findMany();
  if (ubicaciones.length === 0) return res.json([]);

  const idsVehiculos = ubicaciones.map((u) => u.idVehiculo);

  const hoy = new Date();
  hoy.setUTCHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setUTCDate(manana.getUTCDate() + 1);

  const [existencias, ventasHoy] = await Promise.all([
    prisma.ubicacionExistencia.groupBy({
      by: ['idUbicacion'],
      where: { idUbicacion: { in: idsVehiculos } },
      _sum: { saldo: true },
    }),
    prisma.venta.groupBy({
      by: ['idVehiculo'],
      where: { idVehiculo: { in: idsVehiculos }, estado: 'Confirmada', fechaHora: { gte: hoy, lt: manana } },
      _sum: { total: true },
    }),
  ]);

  const existenciaPorVehiculo = Object.fromEntries(existencias.map((e) => [e.idUbicacion, e._sum.saldo || 0]));
  const ventasPorVehiculo = Object.fromEntries(ventasHoy.map((v) => [v.idVehiculo, Number(v._sum.total || 0)]));

  res.json(
    ubicaciones.map((u) => ({
      idVehiculo: u.idVehiculo,
      idChofer: u.idChofer,
      latitud: Number(u.latitud),
      longitud: Number(u.longitud),
      fechaHora: u.fechaHora,
      existenciaTotal: existenciaPorVehiculo[u.idVehiculo] || 0,
      ventasHoy: ventasPorVehiculo[u.idVehiculo] || 0,
    }))
  );
}

module.exports = { actualizar, listar, resumen };
