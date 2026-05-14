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

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);

  const invoiceNumber = formatInvoiceNumber(subscriptionId, timestamp);
  const issueDate = new Date(timestamp).toLocaleDateString('es-ES');
  const dueDate = new Date(timestamp + 1000 * 60 * 60 * 24 * 30).toLocaleDateString('es-ES');
  const totalAmount = formatCurrency(amountPaid, currency);

  // Header - Logo and title
  doc.fontSize(32).font('Helvetica-Bold').fillColor('#008B9D').text('SynapseCode', 50, 50);
  doc.fontSize(11).fillColor('#666666').font('Helvetica').text('Gestión de Suscripciones', 50, 88);
  
  // Invoice number and dates (right aligned)
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a');
  doc.text(`FACTURA`, 380, 50, { width: 120, align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#666666');
  doc.text(`No. ${invoiceNumber}`, 380, 68, { width: 120, align: 'right' });
  doc.text(`Emitida: ${issueDate}`, 380, 82, { width: 120, align: 'right' });
  doc.text(`Vencimiento: ${dueDate}`, 380, 96, { width: 120, align: 'right' });

  // Decorative line
  doc.moveTo(50, 115).lineTo(545, 115).lineWidth(1.5).strokeColor('#008B9D').stroke();

  // Sender and Recipient sections
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#7C2D8A').text('DE:', 50, 135);
  doc.font('Helvetica').fontSize(9).fillColor('#1a1a1a');
  doc.text('SynapseCode', 50, 150);
  doc.font('Helvetica').fontSize(8).fillColor('#666666');
  doc.text('Calle Tecnológica 123, Guatemala, GT', 50, 163);
  doc.text('Email: contacto@synapsecode.com', 50, 174);
  doc.text('Teléfono: +502 1234 5678', 50, 185);

  // Para section
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#7C2D8A').text('PARA:', 280, 135);
  doc.font('Helvetica').fontSize(9).fillColor('#1a1a1a');
  doc.text(name, 280, 150);
  doc.fontSize(8).fillColor('#666666');
  doc.text(email, 280, 163);
  if (institutionName) {
    doc.text(institutionName, 280, 174);
  }
  if (maxParticipants) {
    doc.text(`Estudiantes: ${maxParticipants}`, 280, 185);
  }

  // Decorative line
  doc.moveTo(50, 205).lineTo(545, 205).lineWidth(1).strokeColor('#E0E0E0').stroke();

  // Items table header
  const tableTop = 220;
  doc.rect(50, tableTop, 495, 28).fill('#7C2D8A');
  doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
  doc.text('DESCRIPCIÓN', 60, tableTop + 8);
  doc.text('CANT.', 330, tableTop + 8);
  doc.text('PRECIO UNITARIO', 390, tableTop + 8, { width: 60, align: 'right' });
  doc.text('TOTAL', 490, tableTop + 8, { width: 50, align: 'right' });

  // Table content
  const itemTop = tableTop + 38;
  doc.fillColor('#1a1a1a').fontSize(10).font('Helvetica');
  const quantity = maxParticipants ? maxParticipants : 1;
  const unitPrice = formatCurrency(amountPaid / quantity, currency);
  const lineDescription = planName === 'ORG' ? `Plan ORG - Institución` : `Plan ${planName}`;

  // Background alternation for row
  doc.rect(50, itemTop - 3, 495, 25).fill('#F9F9F9');
  doc.fillColor('#1a1a1a').fontSize(10).font('Helvetica');
  doc.text(lineDescription, 60, itemTop + 5);
  doc.text(quantity.toString(), 330, itemTop + 5);
  doc.text(unitPrice, 390, itemTop + 5, { width: 60, align: 'right' });
  doc.text(totalAmount, 490, itemTop + 5, { width: 50, align: 'right' });

  // Decorative line
  doc.moveTo(50, itemTop + 30).lineTo(545, itemTop + 30).lineWidth(1).strokeColor('#E0E0E0').stroke();

  // Total section
  const totalTop = itemTop + 50;
  doc.rect(350, totalTop - 5, 195, 50).fill('#F0F0F0');
  
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#7C2D8A');
  doc.text('TOTAL A PAGAR:', 360, totalTop + 5, { width: 80, align: 'left' });
  doc.fontSize(18).fillColor('#7C2D8A');
  doc.text(totalAmount, 360, totalTop + 22, { width: 175, align: 'right' });

  // Footer section
  const footerTop = totalTop + 85;
  
  // Decorative top line
  doc.moveTo(50, footerTop - 10).lineTo(545, footerTop - 10).lineWidth(1.5).strokeColor('#008B9D').stroke();

  // Message
  doc.fontSize(9).font('Helvetica').fillColor('#666666').text('Gracias por confiar en SynapseCode. Tu suscripción incluye acceso completo a todas las funcionalidades del plan seleccionado.', 50, footerTop + 5, { width: 495, align: 'center' });

  // Contact info footer
  doc.fontSize(8).fillColor('#999999').text('contacto@synapsecode.com  |  www.synapsecode.com  |  +502 1234 5678', 50, footerTop + 35, { width: 495, align: 'center' });
  
  // Copyright
  doc.fontSize(7).fillColor('#CCCCCC').text('© 2026 SynapseCode. Todos los derechos reservados. Este documento es una factura oficial.', 50, footerTop + 50, { width: 495, align: 'center' });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return { filePath, url };
};
