const crypto = require('crypto');
const prisma = require('../config/db');
const { mensajeAmigable } = require('../utils/errores');

// GET /api/ventas?idVehiculo=VH001
async function listar(req, res) {
  const { idVehiculo } = req.query;
  const ventas = await prisma.venta.findMany({
    where: idVehiculo ? { idVehiculo } : {},
    orderBy: { fechaHora: 'desc' },
    take: 100,
  });
  res.json(ventas);
}

// GET /api/ventas/:id  (encabezado + detalle + pagos)
async function obtener(req, res) {
  const venta = await prisma.venta.findUnique({ where: { idVenta: req.params.id } });
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });

  const detalle = await prisma.detalleVenta.findMany({ where: { idVenta: req.params.id } });
  const pagos = await prisma.pago.findMany({ where: { idVenta: req.params.id } });
  res.json({ ...venta, detalle, pagos });
}

// Busca promocion activa y vigente para cliente+producto. El bonus se agrega
// POR ENCIMA de lo que el cliente pide (pide 5, se lleva 6 -- el chofer solo
// captura lo que el cliente pidio, el regalo es automatico).
async function calcularLineasConPromo(tx, idCliente, idProducto, cantidadSolicitada, precioUnitario) {
  const hoy = new Date();
  const promo = await tx.promocion.findFirst({
    where: { idCliente, idProducto, activa: true, fechaVencimiento: { gte: hoy } },
  });

  if (!promo) {
    return {
      lineas: [{ idProducto, cantidad: cantidadSolicitada, precioUnitario, idPromocion: null, cantidadBonificada: 0, subtotal: cantidadSolicitada * precioUnitario }],
      cantidadFisica: cantidadSolicitada,
    };
  }

  const gruposCompletos = Math.floor(cantidadSolicitada / promo.cantidadCompra);
  const cantidadBonificada = gruposCompletos * promo.cantidadBonificada;

  const lineas = [{ idProducto, cantidad: cantidadSolicitada, precioUnitario, idPromocion: null, cantidadBonificada: 0, subtotal: cantidadSolicitada * precioUnitario }];
  if (cantidadBonificada > 0) {
    lineas.push({ idProducto, cantidad: cantidadBonificada, precioUnitario, idPromocion: promo.idPromocion, cantidadBonificada, subtotal: 0 });
  }
  return { lineas, cantidadFisica: cantidadSolicitada + cantidadBonificada };
}

// POST /api/ventas
// body: { idCliente, idVehiculo, latitud?, longitud?, detalle: [{ idProducto, cantidad }], pago?: { importe, tipoPago } }
async function crear(req, res) {
  const { idCliente, idVehiculo, latitud, longitud, detalle, pago } = req.body;

  if (!idCliente || !idVehiculo || !Array.isArray(detalle) || detalle.length === 0) {
    return res.status(400).json({ error: 'idCliente, idVehiculo y detalle (con al menos 1 producto) son requeridos' });
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const folioRows = await tx.$queryRaw`EXEC sp_GenerarFolioVenta @Fecha = ${new Date()}`;
      const idVenta = folioRows[0].Folio;

      const productos = await tx.producto.findMany({
        where: { idProducto: { in: detalle.map((d) => d.idProducto) } },
      });
      const precioPorProducto = Object.fromEntries(productos.map((p) => [p.idProducto, Number(p.precioVenta)]));

      // Creamos el encabezado primero (con total en 0) porque DetalleVenta
      // depende de que idVenta ya exista.
      await tx.venta.create({
        data: {
          idVenta, idCliente, idVehiculo, latitud, longitud,
          total: 0, usuario: req.usuario.email,
          importePagado: 0,
        },
      });

      let total = 0;
      const todasLasLineas = [];

      for (const item of detalle) {
        const precio = precioPorProducto[item.idProducto];
        if (precio == null) throw new Error(`Producto ${item.idProducto} no encontrado`);

        const { lineas, cantidadFisica } = await calcularLineasConPromo(tx, idCliente, item.idProducto, item.cantidad, precio);
        for (const linea of lineas) {
          total += linea.subtotal;
          todasLasLineas.push(linea);

          await tx.detalleVenta.create({
            data: {
              idMovimiento: crypto.randomUUID(),
              idVenta,
              idProducto: linea.idProducto,
              cantidad: linea.cantidad,
              precioUnitario: linea.precioUnitario,
              idPromocion: linea.idPromocion,
              cantidadBonificada: linea.cantidadBonificada,
              subtotal: linea.subtotal,
            },
          });
        }

        // El Kardex se afecta por el TOTAL de piezas fisicas entregadas
        // (lo pedido + el bonus de promocion), sin importar el precio.
        await tx.$queryRaw`
          EXEC sp_RegistrarMovimientoKardex
            @idUbicacion = ${idVehiculo},
            @idProducto = ${item.idProducto},
            @Cantidad = ${cantidadFisica},
            @idConcepto = 'VTA',
            @Usuario = ${req.usuario.email},
            @Referencia = ${idVenta}
        `;
      }

      // Ahora sí actualizamos el total real calculado
      await tx.venta.update({ where: { idVenta }, data: { total } });

      let importePagado = 0;

      if (pago) {
        if (pago.tipoPago === 'Credito') {
          const cliente = await tx.cliente.findUnique({ where: { idCliente } });
          if (!cliente?.credito) {
            throw new Error('Este cliente no tiene credito habilitado');
          }
          const nuevoSaldo = Number(cliente.saldoCredito) + total;
          if (cliente.limiteCredito != null && nuevoSaldo > Number(cliente.limiteCredito)) {
            throw new Error(`La venta excede el limite de credito del cliente (limite: $${Number(cliente.limiteCredito).toFixed(2)}, saldo actual: $${Number(cliente.saldoCredito).toFixed(2)})`);
          }
          await tx.cliente.update({ where: { idCliente }, data: { saldoCredito: nuevoSaldo } });

          await tx.pago.create({
            data: { idPago: crypto.randomUUID(), idVenta, importe: total, tipoPago: 'Credito', usuario: req.usuario.email },
          });
          // importePagado se queda en 0 -- no entro efectivo ni se cobro de inmediato
        } else {
          // Efectivo o Transferencia: si es transferencia, la evidencia (foto) es importante
          await tx.pago.create({
            data: {
              idPago: crypto.randomUUID(),
              idVenta,
              importe: pago.importe,
              tipoPago: pago.tipoPago || 'Efectivo',
              evidencia: pago.evidencia || undefined,
              usuario: req.usuario.email,
            },
          });
          importePagado = pago.importe;
        }
        await tx.venta.update({ where: { idVenta }, data: { importePagado } });
      }

      return { idVenta, total, detalle: todasLasLineas };
    });

    res.status(201).json(resultado);
  } catch (err) {
    res.status(400).json({ error: mensajeAmigable(err) });
  }
}

// POST /api/ventas/:id/cancelar   (solo Admin)  body: { motivo }
async function cancelar(req, res) {
  const { motivo } = req.body;
  if (!motivo) return res.status(400).json({ error: 'motivo es requerido' });

  const venta = await prisma.venta.findUnique({ where: { idVenta: req.params.id } });
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
  if (venta.estado === 'Cancelada') return res.status(400).json({ error: 'La venta ya estaba cancelada' });

  try {
    await prisma.$transaction(async (tx) => {
      const detalle = await tx.detalleVenta.findMany({ where: { idVenta: req.params.id } });

      // Agrupamos por producto para regresar el total de piezas a la camioneta
      const totalesPorProducto = {};
      for (const linea of detalle) {
        totalesPorProducto[linea.idProducto] = (totalesPorProducto[linea.idProducto] || 0) + linea.cantidad;
      }

      for (const [idProducto, cantidad] of Object.entries(totalesPorProducto)) {
        await tx.$queryRaw`
          EXEC sp_RegistrarMovimientoKardex
            @idUbicacion = ${venta.idVehiculo},
            @idProducto = ${idProducto},
            @Cantidad = ${cantidad},
            @idConcepto = 'CAN',
            @Usuario = ${req.usuario.email},
            @Referencia = ${venta.idVenta},
            @Notas = ${'Reversion por cancelacion: ' + motivo}
        `;
      }

      await tx.venta.update({
        where: { idVenta: req.params.id },
        data: {
          estado: 'Cancelada',
          motivoCancelacion: motivo,
          usuarioCancelacion: req.usuario.email,
          fechaCancelacion: new Date(),
        },
      });
    });

    res.json({ mensaje: 'Venta cancelada y Kardex revertido' });
  } catch (err) {
    res.status(400).json({ error: mensajeAmigable(err) });
  }
}

module.exports = { listar, obtener, crear, cancelar };
