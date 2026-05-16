import { Writable } from 'stream';
import PDFDocument from 'pdfkit';
import { uploadInvoicePdfFromBuffer } from './cloudinary-invoice-service.js';

const PDF_COLORS = {
  brandBlue: '#008B9D',
  brandPurple: '#7C2D8A',
  divider: '#E0E0E0',
  rowBackground: '#F9F9F9',
  totalBackground: '#F0F0F0',
  bodyText: '#666666',
  mutedText: '#999999',
  copyrightText: '#CCCCCC',
};

/**
 * Crea un writable stream que acumula chunks en un buffer
 */
const createBufferStream = () => {
  const chunks = [];
  return {
    stream: new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      },
    }),
    getBuffer: () => Buffer.concat(chunks),
  };
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

const sanitizeFileNamePart = (value, fallback) => {
  const sanitized = String(value || fallback)
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');

  return sanitized || fallback;
};

const formatInvoiceDateForFileName = (timestamp) => new Date(timestamp).toISOString().slice(0, 10);

export const createInvoicePdf = async ({
  subscriptionId,
  planName,
  username,
  name,
  email,
  amountPaid,
  currency = 'USD',
  institutionName,
  maxParticipants,
}) => {
  const timestamp = Date.now();
  const safeUsername = sanitizeFileNamePart(username, 'Usuario');
  const safePlanName = sanitizeFileNamePart(planName, 'Plan');
  const invoiceDate = formatInvoiceDateForFileName(timestamp);
  const fileName = `Factura_${safeUsername}_${safePlanName}_${invoiceDate}.pdf`;

  // Usar Buffer stream en lugar de archivo temporal
  const { stream, getBuffer } = createBufferStream();

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(stream);

  const invoiceNumber = formatInvoiceNumber(subscriptionId, timestamp);
  const issueDate = new Date(timestamp).toLocaleDateString('es-ES');
  const dueDate = new Date(timestamp + 1000 * 60 * 60 * 24 * 30).toLocaleDateString('es-ES');
  const totalAmount = formatCurrency(amountPaid, currency);

  // Header
  doc.fontSize(32).font('Helvetica-Bold').fillColor(PDF_COLORS.brandBlue).text('SynapseCode', 50, 50);
  doc.fontSize(11).fillColor(PDF_COLORS.bodyText).font('Helvetica').text('Gestion de Suscripciones', 50, 88);

  // Invoice number and dates
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1A1A1A');
  doc.text('FACTURA', 380, 50, { width: 120, align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor(PDF_COLORS.bodyText);
  doc.text(`No. ${invoiceNumber}`, 380, 68, { width: 120, align: 'right' });
  doc.text(`Emitida: ${issueDate}`, 380, 82, { width: 120, align: 'right' });
  doc.text(`Vencimiento: ${dueDate}`, 380, 96, { width: 120, align: 'right' });

  doc.moveTo(50, 115).lineTo(545, 115).lineWidth(1.5).strokeColor(PDF_COLORS.brandBlue).stroke();

  // Sender and recipient sections
  doc.fontSize(9).font('Helvetica-Bold').fillColor(PDF_COLORS.brandPurple).text('DE:', 50, 135);
  doc.font('Helvetica').fontSize(9).fillColor('#1A1A1A');
  doc.text('SynapseCode', 50, 150);
  doc.font('Helvetica').fontSize(8).fillColor(PDF_COLORS.bodyText);
  doc.text('Calle Tecnologica 123, Guatemala, GT', 50, 163);
  doc.text('Email: synapsecode823@gmail.com', 50, 174);
  doc.text('Telefono: +502 1234 5678', 50, 185);

  doc.fontSize(9).font('Helvetica-Bold').fillColor(PDF_COLORS.brandPurple).text('PARA:', 280, 135);
  doc.font('Helvetica').fontSize(9).fillColor('#1A1A1A');
  doc.text(name, 280, 150);
  doc.fontSize(8).fillColor(PDF_COLORS.bodyText);
  doc.text(email, 280, 163);
  if (institutionName) {
    doc.text(institutionName, 280, 174);
  }
  if (maxParticipants) {
    doc.text(`Estudiantes: ${maxParticipants}`, 280, 185);
  }

  doc.moveTo(50, 205).lineTo(545, 205).lineWidth(1).strokeColor(PDF_COLORS.divider).stroke();

  // Items table
  const tableTop = 220;
  doc.rect(50, tableTop, 495, 28).fill(PDF_COLORS.brandPurple);
  doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
  doc.text('DESCRIPCION', 60, tableTop + 8);
  doc.text('CANT.', 330, tableTop + 8);
  doc.text('PRECIO UNITARIO', 390, tableTop + 8, { width: 60, align: 'right' });
  doc.text('TOTAL', 490, tableTop + 8, { width: 50, align: 'right' });

  const itemTop = tableTop + 38;
  doc.fillColor('#1A1A1A').fontSize(10).font('Helvetica');
  const quantity = maxParticipants || 1;
  const unitPrice = formatCurrency(amountPaid / quantity, currency);
  const lineDescription = planName === 'ORG' ? 'Plan ORG - Institucion' : `Plan ${planName}`;

  doc.rect(50, itemTop - 3, 495, 25).fill(PDF_COLORS.rowBackground);
  doc.fillColor('#1A1A1A').fontSize(10).font('Helvetica');
  doc.text(lineDescription, 60, itemTop + 5);
  doc.text(quantity.toString(), 330, itemTop + 5);
  doc.text(unitPrice, 390, itemTop + 5, { width: 60, align: 'right' });
  doc.text(totalAmount, 490, itemTop + 5, { width: 50, align: 'right' });

  doc.moveTo(50, itemTop + 30).lineTo(545, itemTop + 30).lineWidth(1).strokeColor(PDF_COLORS.divider).stroke();

  // Total section
  const totalTop = itemTop + 50;
  doc.rect(350, totalTop - 5, 195, 50).fill(PDF_COLORS.totalBackground);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(PDF_COLORS.brandPurple);
  doc.text('TOTAL A PAGAR:', 360, totalTop + 5, { width: 80, align: 'left' });
  doc.fontSize(18).fillColor(PDF_COLORS.brandPurple);
  doc.text(totalAmount, 360, totalTop + 22, { width: 175, align: 'right' });

  // Footer
  const footerTop = totalTop + 85;
  doc.moveTo(50, footerTop - 10).lineTo(545, footerTop - 10).lineWidth(1.5).strokeColor(PDF_COLORS.brandBlue).stroke();
  doc.fontSize(9).font('Helvetica').fillColor(PDF_COLORS.bodyText).text(
    'Gracias por confiar en SynapseCode. Tu suscripcion incluye acceso completo a todas las funcionalidades del plan seleccionado.',
    50,
    footerTop + 5,
    { width: 495, align: 'center' }
  );

  doc.fontSize(8).fillColor(PDF_COLORS.mutedText).text(
    'synapsecode823@gmail.com  |  www.synapsecode.com  |  +502 1234 5678',
    50,
    footerTop + 35,
    { width: 495, align: 'center' }
  );

  doc.fontSize(7).fillColor(PDF_COLORS.bodyText).text(
    '(c) 2026 SynapseCode. Todos los derechos reservados. Este documento es una factura oficial.',
    50,
    footerTop + 50,
    { width: 495, align: 'center' }
  );

  doc.end();

  // Esperar a que el PDF se acumule completamente en el buffer
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  try {
    console.log('Uploading invoice to Cloudinary...', { fileName });
    const pdfBuffer = getBuffer();
    
    // Validar que el buffer tenga contenido válido
    if (!pdfBuffer || pdfBuffer.length < 100) {
      throw new Error('PDF buffer is empty or too small');
    }

    console.log('PDF buffer size:', pdfBuffer.length, 'bytes');

    const cloudinaryResult = await uploadInvoicePdfFromBuffer(pdfBuffer, fileName);

    console.log('Invoice uploaded to Cloudinary successfully:', cloudinaryResult.publicId);
    return {
      url: cloudinaryResult.url,
      publicId: cloudinaryResult.publicId,
      filePath: null,
      storage: 'cloudinary',
    };
  } catch (error) {
    console.error('Failed to upload invoice to Cloudinary:', error?.message || error);
    throw new Error('Error uploading invoice to Cloudinary: ' + (error?.message || error));
  }
};
