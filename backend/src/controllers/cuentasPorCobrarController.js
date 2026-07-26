const prisma = require('../config/db');
const { mensajeAmigable } = require('../utils/errores');

// GET /api/cuentas-por-cobrar -- lista de clientes con saldo pendiente
async function listarConSaldo(req, res) {
  const clientes = await prisma.cliente.findMany({
    where: { saldoCredito: { gt: 0 } },
    orderBy: { saldoCredito: 'desc' },
  });
  res.json(clientes);
}

// GET /api/clientes/:idCliente/cuenta -- detalle: ventas a credito + abonos
async function obtenerCuenta(req, res) {
  const { idCliente } = req.params;

  const cliente = await prisma.cliente.findUnique({ where: { idCliente } });
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

  // Ventas a credito: las que tienen un Pago con tipoPago = 'Credito'
  const pagosCredito = await prisma.pago.findMany({ where: { tipoPago: 'Credito' } });
  const idsVentasCredito = pagosCredito.map((p) => p.idVenta);

  const [ventasCredito, abonos] = await Promise.all([
    prisma.venta.findMany({
      where: { idVenta: { in: idsVentasCredito }, idCliente },
      orderBy: { fechaHora: 'desc' },
    }),
    prisma.abono.findMany({ where: { idCliente }, orderBy: { fecha: 'desc' } }),
  ]);

  res.json({
    idCliente: cliente.idCliente,
    nombre: cliente.nombre,
    credito: cliente.credito,
    limiteCredito: cliente.limiteCredito,
    saldoCredito: cliente.saldoCredito,
    ventasCredito,
    abonos,
  });
}

// POST /api/clientes/:idCliente/abonos
// body: { monto, metodoPago, fotoComprobante?, notas? }
async function registrarAbono(req, res) {
  const { idCliente } = req.params;
  const { monto, metodoPago, fotoComprobante, notas } = req.body;

  if (!monto || !metodoPago) {
    return res.status(400).json({ error: 'monto y metodoPago son requeridos' });
  }
  if (!['Efectivo', 'Transferencia'].includes(metodoPago)) {
    return res.status(400).json({ error: "metodoPago debe ser 'Efectivo' o 'Transferencia'" });
  }

  try {
    const rows = await prisma.$queryRaw`
      EXEC sp_RegistrarAbono
        @idCliente = ${idCliente},
        @EmailUsuario = ${req.usuario.email},
        @Monto = ${monto},
        @MetodoPago = ${metodoPago},
        @FotoComprobante = ${fotoComprobante || null},
        @Notas = ${notas || null}
    `;
    res.status(201).json({ idAbono: rows[0].idAbono, saldoNuevo: Number(rows[0].saldoNuevo) });
  } catch (err) {
    res.status(400).json({ error: mensajeAmigable(err) });
  }
}

module.exports = { listarConSaldo, obtenerCuenta, registrarAbono };
