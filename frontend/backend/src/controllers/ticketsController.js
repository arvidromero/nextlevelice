const PDFDocument = require('pdfkit');
const path = require('path');
const prisma = require('../config/db');

const LOGO_PATH = path.join(__dirname, '../../assets/logo-reportes.png');

// GET /api/ventas/:id/ticket-pdf
async function ticketPDF(req, res) {
  const venta = await prisma.venta.findUnique({ where: { idVenta: req.params.id } });
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });

  const [detalle, cliente, pagos] = await Promise.all([
    prisma.detalleVenta.findMany({ where: { idVenta: req.params.id } }),
    prisma.cliente.findUnique({ where: { idCliente: venta.idCliente } }),
    prisma.pago.findMany({ where: { idVenta: req.params.id } }),
  ]);

  const productos = await prisma.producto.findMany({
    where: { idProducto: { in: detalle.map((d) => d.idProducto) } },
  });
  const nombreDe = (id) => productos.find((p) => p.idProducto === id)?.descripcion ?? id;

  // Papel termico de 80mm (72mm imprimibles). 1mm = 2.8346pt
  const anchoPt = 80 * 2.8346;
  const altoEstimado = 280 + detalle.length * 16;
  const margen = 12;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="ticket-${venta.idVenta}.pdf"`);

  const doc = new PDFDocument({ size: [anchoPt, altoEstimado], margin: margen });
  doc.pipe(res);

  const centro = { align: 'center', width: anchoPt - margen * 2 };

  const anchoLogo = 110;
  const altoLogo = anchoLogo * (551 / 600);
  const yLogo = doc.y;
  doc.image(LOGO_PATH, (anchoPt - anchoLogo) / 2, yLogo, { width: anchoLogo });
  doc.y = yLogo + altoLogo + 6;
  doc.font('Helvetica').fontSize(8).text('fashion | gourmet ICE', centro);
  doc.moveDown(0.5);
  doc.fontSize(9).text('- - - - - - - - - - - - - - - - - -', centro);
  doc.moveDown(0.3);

  doc.font('Helvetica-Bold').fontSize(10).text(`Folio: ${venta.idVenta}`);
  doc.font('Helvetica').fontSize(9);
  doc.text(`Fecha: ${new Date(venta.fechaHora).toLocaleString('es-MX')}`);
  doc.text(`Cliente: ${cliente?.nombre ?? venta.idCliente}`);
  doc.moveDown(0.3);
  doc.text('- - - - - - - - - - - - - - - - - -', centro);

  doc.moveDown(0.2);
  for (const d of detalle) {
    const esGratis = d.cantidadBonificada > 0;
    const importeTxt = esGratis ? 'GRATIS' : `$${Number(d.subtotal).toFixed(2)}`;
    doc.font('Helvetica').fontSize(9).text(`${d.cantidad}x ${nombreDe(d.idProducto)}`, { continued: false });
    doc.font(esGratis ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).text(`   ${importeTxt}`, { align: 'right' });
  }

  doc.moveDown(0.3);
  doc.fontSize(9).text('- - - - - - - - - - - - - - - - - -', centro);
  doc.moveDown(0.2);
  doc.font('Helvetica-Bold').fontSize(13).text(`TOTAL: $${Number(venta.total).toFixed(2)}`, { align: 'right' });
  doc.font('Helvetica').fontSize(9);
  if (pagos[0]) doc.text(`Pago: ${pagos[0].tipoPago}`, { align: 'right' });

  doc.moveDown(0.8);
  doc.fontSize(8).text('¡Gracias por su compra!', centro);
  doc.fontSize(7).fillColor('#888').text('www.nextlevelice.com', centro);

  doc.end();
}

module.exports = { ticketPDF };
