const PDFDocument = require('pdfkit');
const path = require('path');
const prisma = require('../config/db');

const LOGO_PATH = path.join(__dirname, '../../assets/logo-reportes.png');

function formatoFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
function formatoHora(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}
function money(n) {
  return `$${Number(n).toFixed(2)}`;
}

// GET /api/bitacoras/:id/reporte-pdf
async function reportePDF(req, res) {
  const bitacora = await prisma.bitacora.findUnique({ where: { idBitacora: req.params.id } });
  if (!bitacora) return res.status(404).json({ error: 'Bitacora no encontrada' });

  const inicioDia = new Date(bitacora.fecha);
  const finDia = new Date(inicioDia);
  finDia.setDate(finDia.getDate() + 1);

  const [ventas, abastecimientos, movimientosExtra, corteRows] = await Promise.all([
    prisma.venta.findMany({
      where: { idVehiculo: bitacora.idVehiculo, fechaHora: { gte: inicioDia, lt: finDia } },
      orderBy: { fechaHora: 'asc' },
    }),
    prisma.abastecimiento.findMany({ where: { idBitacora: bitacora.idBitacora } }),
    prisma.movimientoExtra.findMany({ where: { idBitacora: bitacora.idBitacora } }),
    prisma.$queryRaw`SELECT * FROM vw_CorteCaja WHERE idBitacora = ${bitacora.idBitacora}`,
  ]);
  const corte = corteRows[0];

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="reporte-${bitacora.idVehiculo}-${bitacora.fecha.toISOString().slice(0, 10)}.pdf"`);

  const doc = new PDFDocument({ margin: 45, size: 'A4' });
  doc.pipe(res);

  // ---- Encabezado ----
  const yInicio = doc.y;
  doc.image(LOGO_PATH, 45, yInicio, { width: 70 });
  doc.fontSize(16).font('Helvetica-Bold').text('Reporte de operación diaria', 130, yInicio + 22);
  doc.y = yInicio + 75;
  doc.fontSize(11).font('Helvetica').fillColor('#444')
    .text(`Vehiculo: ${bitacora.idVehiculo}    Chofer: ${bitacora.idChofer}    Fecha: ${formatoFecha(bitacora.fecha)}`);
  doc.fillColor('#000');
  doc.moveDown(1);
  doc.moveTo(45, doc.y).lineTo(550, doc.y).strokeColor('#DDD').stroke();
  doc.moveDown(0.8);

  // ---- Checklist ----
  doc.fontSize(13).font('Helvetica-Bold').text('Checklist del vehiculo');
  doc.fontSize(10).font('Helvetica').moveDown(0.4);
  doc.text(`Estado: ${bitacora.estado}`);
  doc.text(`Salida: ${formatoHora(bitacora.fhSalida)}    Llegada: ${formatoHora(bitacora.fhLlegada)}`);
  doc.text(`Odometro inicial: ${bitacora.odometroInicial ?? '—'} km    Odometro final: ${bitacora.odometroFinal ?? '—'} km`);
  if (bitacora.odometroInicial != null && bitacora.odometroFinal != null) {
    doc.text(`Kilometros recorridos: ${bitacora.odometroFinal - bitacora.odometroInicial} km`);
  }
  doc.text(`Varilla de aceite: ${bitacora.varillaAntes ?? '—'} -> ${bitacora.varillaDespues ?? '—'}`);
  doc.text(`Liquido de frenos: ${bitacora.liquidoFrenos ?? '—'}    Liquido de direccion: ${bitacora.liquidoDireccion ?? '—'}`);
  doc.text(`Aprobado por: ${bitacora.usuarioAprobo ?? 'Sin aprobar'}`);
  doc.moveDown(1);

  // ---- Ventas ----
  doc.fontSize(13).font('Helvetica-Bold').text(`Ventas del dia (${ventas.length})`);
  doc.fontSize(10).font('Helvetica').moveDown(0.4);
  if (ventas.length === 0) {
    doc.fillColor('#888').text('Sin ventas registradas.').fillColor('#000');
  } else {
    for (const v of ventas) {
      const color = v.estado === 'Cancelada' ? '#B3261E' : '#000';
      doc.fillColor(color).text(`${v.idVenta}   Cliente: ${v.idCliente}   ${formatoHora(v.fechaHora)}   ${money(v.total)}   [${v.estado}]`);
    }
    doc.fillColor('#000');
    const totalVentas = ventas.filter((v) => v.estado === 'Confirmada').reduce((a, v) => a + Number(v.total), 0);
    doc.font('Helvetica-Bold').text(`Subtotal ventas confirmadas: ${money(totalVentas)}`);
  }
  doc.moveDown(1);

  // ---- Abastecimientos ----
  doc.fontSize(13).font('Helvetica-Bold').text('Abastecimientos de gas');
  doc.fontSize(10).font('Helvetica').moveDown(0.4);
  if (abastecimientos.length === 0) {
    doc.fillColor('#888').text('Sin cargas de gas registradas.').fillColor('#000');
  } else {
    for (const a of abastecimientos) {
      doc.text(`${formatoHora(a.fechaHora)}   ${a.litros ? a.litros + ' L   ' : ''}${money(a.importe)}   ${a.ubicacion ?? ''}`);
    }
  }
  doc.moveDown(1);

  // ---- Gastos e ingresos extra ----
  doc.fontSize(13).font('Helvetica-Bold').text('Gastos e ingresos extra');
  doc.fontSize(10).font('Helvetica').moveDown(0.4);
  if (movimientosExtra.length === 0) {
    doc.fillColor('#888').text('Sin movimientos registrados.').fillColor('#000');
  } else {
    for (const m of movimientosExtra) {
      const signo = m.tipo === 'Gasto' ? '-' : '+';
      doc.text(`${formatoHora(m.fechaHora)}   [${m.tipo}] ${m.concepto}   ${signo}${money(m.importe)}`);
    }
  }
  doc.moveDown(1);

  // ---- Corte de caja ----
  doc.moveTo(45, doc.y).lineTo(550, doc.y).strokeColor('#DDD').stroke();
  doc.moveDown(0.8);
  doc.fontSize(13).font('Helvetica-Bold').text('Corte de caja');
  doc.fontSize(11).font('Helvetica').moveDown(0.4);
  if (corte) {
    doc.text(`Ventas:              ${money(corte.TotalVentas)}`);
    doc.text(`Abastecimientos:     -${money(corte.TotalAbastecimientos)}`);
    doc.text(`Gastos:              -${money(corte.TotalGastos)}`);
    doc.text(`Ingresos extra:      +${money(corte.TotalIngresos)}`);
    doc.moveDown(0.3);
    doc.fontSize(14).font('Helvetica-Bold').text(`Total a entregar: ${money(corte.TotalAEntregar)}`);
  } else {
    doc.fillColor('#888').text('No disponible.').fillColor('#000');
  }

  doc.end();
}

module.exports = { reportePDF };
