const prisma = require('../config/db');

function inicioDia(offsetDias = 0) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDias);
  return d;
}

// Trae las ventas confirmadas que cumplen con cliente/operador/fecha
// (el filtro de producto se resuelve aparte, cruzando con DetalleVenta)
async function ventasBase(query) {
  const { fechaDesde, fechaHasta, idCliente, usuario } = query;
  const where = { estado: 'Confirmada' };

  if (fechaDesde || fechaHasta) {
    where.fechaHora = {};
    if (fechaDesde) where.fechaHora.gte = new Date(`${fechaDesde}T00:00:00.000Z`);
    if (fechaHasta) where.fechaHora.lte = new Date(`${fechaHasta}T23:59:59.999Z`);
  }
  if (idCliente) where.idCliente = idCliente;
  if (usuario) where.usuario = usuario;

  return prisma.venta.findMany({
    where,
    select: { idVenta: true, idVehiculo: true, idCliente: true, total: true, fechaHora: true, latitud: true, longitud: true },
  });
}

// Si hay filtro de producto, restringe la lista de ventas a las que
// contienen ese producto, y calcula el subtotal real de ESE producto
// dentro de cada venta (no el total completo de la venta).
async function aplicarFiltroProducto(ventas, idProducto) {
  if (!idProducto) return ventas.map((v) => ({ ...v, montoRelevante: Number(v.total) }));

  const ids = ventas.map((v) => v.idVenta);
  if (ids.length === 0) return [];

  const lineas = await prisma.detalleVenta.groupBy({
    by: ['idVenta'],
    where: { idVenta: { in: ids }, idProducto },
    _sum: { subtotal: true },
  });
  const mapa = new Map(lineas.map((l) => [l.idVenta, Number(l._sum.subtotal || 0)]));

  return ventas.filter((v) => mapa.has(v.idVenta)).map((v) => ({ ...v, montoRelevante: mapa.get(v.idVenta) }));
}

// GET /api/dashboard/ventas-hoy  (siempre hoy/ayer, no usa los filtros de la barra)
async function ventasHoy(req, res) {
  const hoy = inicioDia(0), manana = inicioDia(1), ayer = inicioDia(-1), hace7 = inicioDia(-7);

  const [rHoy, rAyer, rSemana] = await Promise.all([
    prisma.venta.aggregate({ where: { fechaHora: { gte: hoy, lt: manana }, estado: 'Confirmada' }, _sum: { total: true } }),
    prisma.venta.aggregate({ where: { fechaHora: { gte: ayer, lt: hoy }, estado: 'Confirmada' }, _sum: { total: true } }),
    prisma.venta.aggregate({ where: { fechaHora: { gte: hace7, lt: manana }, estado: 'Confirmada' }, _sum: { total: true } }),
  ]);

  res.json({
    hoy: Number(rHoy._sum.total || 0),
    ayer: Number(rAyer._sum.total || 0),
    promedio7dias: Number(rSemana._sum.total || 0) / 7,
  });
}

// GET /api/dashboard/por-vehiculo?fechaDesde=&fechaHasta=&idCliente=&usuario=&idProducto=
async function porVehiculo(req, res) {
  const base = await ventasBase(req.query);
  const filtradas = await aplicarFiltroProducto(base, req.query.idProducto);

  const acumulado = {};
  for (const v of filtradas) {
    acumulado[v.idVehiculo] = acumulado[v.idVehiculo] || { total: 0, numVentas: 0 };
    acumulado[v.idVehiculo].total += v.montoRelevante;
    acumulado[v.idVehiculo].numVentas += 1;
  }
  res.json(
    Object.entries(acumulado)
      .map(([idVehiculo, d]) => ({ idVehiculo, total: d.total, numVentas: d.numVentas }))
      .sort((a, b) => b.total - a.total)
  );
}

// GET /api/dashboard/por-producto?...
async function porProducto(req, res) {
  const base = await ventasBase(req.query);
  const ids = base.map((v) => v.idVenta);
  if (ids.length === 0) return res.json([]);

  const where = { idVenta: { in: ids } };
  if (req.query.idProducto) where.idProducto = req.query.idProducto;

  const grupos = await prisma.detalleVenta.groupBy({
    by: ['idProducto'],
    where,
    _sum: { cantidad: true, subtotal: true },
  });

  res.json(
    grupos
      .map((g) => ({ idProducto: g.idProducto, cantidad: g._sum.cantidad, total: Number(g._sum.subtotal || 0) }))
      .sort((a, b) => b.total - a.total)
  );
}

// GET /api/dashboard/por-cliente?...
async function porCliente(req, res) {
  const base = await ventasBase(req.query);
  const filtradas = await aplicarFiltroProducto(base, req.query.idProducto);

  const acumulado = {};
  for (const v of filtradas) {
    acumulado[v.idCliente] = acumulado[v.idCliente] || { total: 0, numVentas: 0 };
    acumulado[v.idCliente].total += v.montoRelevante;
    acumulado[v.idCliente].numVentas += 1;
  }
  res.json(
    Object.entries(acumulado)
      .map(([idCliente, d]) => ({ idCliente, total: d.total, numVentas: d.numVentas }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  );
}

// GET /api/dashboard/tendencia?...
async function tendencia(req, res) {
  const base = await ventasBase(req.query);
  const filtradas = await aplicarFiltroProducto(base, req.query.idProducto);

  const acumulado = {};
  for (const v of filtradas) {
    const fecha = new Date(v.fechaHora).toISOString().slice(0, 10);
    acumulado[fecha] = (acumulado[fecha] || 0) + v.montoRelevante;
  }
  res.json(
    Object.entries(acumulado)
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
  );
}

// GET /api/dashboard/mapa-calor?...
async function mapaCalor(req, res) {
  const base = await ventasBase(req.query);
  const filtradas = await aplicarFiltroProducto(base, req.query.idProducto);
  res.json(
    filtradas
      .filter((v) => v.latitud != null && v.longitud != null)
      .map((v) => ({ lat: Number(v.latitud), lng: Number(v.longitud) }))
  );
}

// GET /api/dashboard/cortes-caja-hoy
async function cortesCajaHoy(req, res) {
  const hoy = inicioDia(0);
  const filas = await prisma.$queryRaw`SELECT * FROM vw_CorteCaja WHERE Fecha = ${hoy}`;
  res.json(filas);
}

// GET /api/dashboard/exportar-csv?...  -- exporta el detalle de las ventas filtradas
async function exportarCSV(req, res) {
  const base = await ventasBase(req.query);
  const ids = base.map((v) => v.idVenta);

  const where = { idVenta: { in: ids } };
  if (req.query.idProducto) where.idProducto = req.query.idProducto;
  const detalles = ids.length > 0 ? await prisma.detalleVenta.findMany({ where }) : [];

  const idsConProducto = new Set(detalles.map((d) => d.idVenta));
  const mapaVenta = new Map(base.filter((v) => !req.query.idProducto || idsConProducto.has(v.idVenta)).map((v) => [v.idVenta, v]));

  let csv = 'Folio,Fecha,idCliente,idVehiculo,idProducto,Cantidad,Subtotal,TotalVenta\n';
  for (const d of detalles) {
    const v = mapaVenta.get(d.idVenta);
    if (!v) continue;
    csv += `${d.idVenta},${new Date(v.fechaHora).toLocaleString('es-MX', { timeZone: 'UTC' })},${v.idCliente},${v.idVehiculo},${d.idProducto},${d.cantidad},${Number(d.subtotal).toFixed(2)},${Number(v.total).toFixed(2)}\n`;
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="dashboard-export.csv"');
  res.send('\uFEFF' + csv); // BOM para que Excel lea bien los acentos
}

module.exports = { ventasHoy, porVehiculo, porProducto, porCliente, tendencia, mapaCalor, cortesCajaHoy, exportarCSV };
