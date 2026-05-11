import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import config from '../configs/config.js';

const invoicesDir = path.resolve('public', 'invoices');

const ensureInvoicesDir = () => {
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
  }
};

const formatCurrency = (amount, currency = 'USD') => {
  const normalized = Number(amount) || 0;
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(normalized);
};

const formatInvoiceNumber = (subscriptionId, timestamp) => {
  const id = String(subscriptionId).slice(-6).padStart(6, '0');
  return `SC-${new Date(timestamp).getFullYear()}-${id}`;
};

export const createInvoicePdf = async ({
  subscriptionId,
  planName,
  name,
  email,
  amountPaid,
  currency = 'USD',
  institutionName,
  maxParticipants,
}) => {
  ensureInvoicesDir();

  const timestamp = Date.now();
  const fileName = `factura_synapsecode_${subscriptionId}_${timestamp}.pdf`;
  const filePath = path.join(invoicesDir, fileName);
  const url = `${config.service_url}/invoices/${fileName}`;

  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);

  const invoiceNumber = formatInvoiceNumber(subscriptionId, timestamp);
  const issueDate = new Date(timestamp).toLocaleDateString('es-ES');
  const dueDate = new Date(timestamp + 1000 * 60 * 60 * 24 * 30).toLocaleDateString('es-ES');
  const totalAmount = formatCurrency(amountPaid, currency);

  // Header
  doc.rect(48, 48, 500, 100).fill('#00A5B2');
  doc.fillColor('#ffffff').fontSize(26).font('Helvetica-Bold').text('SynapseCode', 60, 60);
  doc.fontSize(10).font('Helvetica').text('Facturación y suscripción', 60, 90);

  doc.fillColor('#ffffff').fontSize(10).text(`Factura # ${invoiceNumber}`, 380, 60, { align: 'right' });
  doc.text(`Emitido: ${issueDate}`, { align: 'right' });
  doc.text(`Vencimiento: ${dueDate}`, { align: 'right' });

  // Sender / recipient blocks
  doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text('De:', 60, 170);
  doc.font('Helvetica').fontSize(9).text('SynapseCode', 60, 185);
  doc.text('Calle Tecnológica 123', 60, 200);
  doc.text('Guatemala, GT', 60, 215);
  doc.text('contacto@synapsecode.com', 60, 230);

  doc.font('Helvetica-Bold').text('Para:', 320, 170);
  doc.font('Helvetica').fontSize(9).text(name, 320, 185);
  doc.text(email, 320, 200);
  if (institutionName) {
    doc.text(institutionName, 320, 215);
  }
  if (maxParticipants) {
    doc.text(`Estudiantes: ${maxParticipants}`, 320, 230);
  }

  // Table header
  const tableTop = 270;
  doc.fillColor('#00A5B2').rect(48, tableTop, 500, 26).fill();
  doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
  doc.text('Descripción', 60, tableTop + 7);
  doc.text('Cantidad', 300, tableTop + 7);
  doc.text('Precio', 380, tableTop + 7, { width: 90, align: 'right' });
  doc.text('Total', 480, tableTop + 7, { width: 70, align: 'right' });

  doc.fillColor('#0F172A').font('Helvetica').fontSize(10);
  const itemTop = tableTop + 40;
  const quantity = maxParticipants ? maxParticipants : 1;
  const unitPrice = formatCurrency(amountPaid / quantity, currency);
  const lineDescription = planName === 'ORG' ? `Plan ORG - Institución` : `Plan ${planName}`;

  doc.text(lineDescription, 60, itemTop);
  doc.text(quantity.toString(), 300, itemTop);
  doc.text(unitPrice, 380, itemTop, { width: 90, align: 'right' });
  doc.text(totalAmount, 480, itemTop, { width: 70, align: 'right' });

  doc.moveTo(48, itemTop + 28).lineTo(548, itemTop + 28).lineWidth(1).stroke('#E2E8F0');

  // Total block
  const totalTop = itemTop + 60;
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#0F172A');
  doc.text('TOTAL', 380, totalTop, { width: 90, align: 'right' });
  doc.text(totalAmount, 480, totalTop, { width: 70, align: 'right' });

  // Footer notes
  const footerTop = totalTop + 60;
  doc.font('Helvetica').fontSize(9).fillColor('#475569');
  doc.text('Gracias por confiar en SynapseCode para tu gestión de planes empresariales.', 60, footerTop, {
    width: 430,
    align: 'left',
  });

  doc.fontSize(9).fillColor('#0F172A').font('Helvetica-Bold').text('Contacto', 60, footerTop + 40);
  doc.font('Helvetica').fontSize(9).fillColor('#475569').text('contacto@synapsecode.com', 60, footerTop + 55);
  doc.text('+502 1234 5678', 60, footerTop + 70);

  doc.font('Helvetica-Bold').text('Dirección', 260, footerTop + 40);
  doc.font('Helvetica').fontSize(9).fillColor('#475569').text('Calle Tecnológica 123', 260, footerTop + 55);
  doc.text('Guatemala, GT', 260, footerTop + 70);

  doc.font('Helvetica-Bold').text('web', 420, footerTop + 40);
  doc.font('Helvetica').fontSize(9).fillColor('#475569').text('www.synapsecode.com', 420, footerTop + 55);

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return { filePath, url };
};
