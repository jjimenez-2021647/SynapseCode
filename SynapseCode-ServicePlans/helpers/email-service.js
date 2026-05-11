import nodemailer from 'nodemailer';
import config from '../configs/config.js';

let transporter;

if (config.email.username && config.email.password) {
  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: false,
    auth: {
      user: config.email.username,
      pass: config.email.password,
    },
  });
} else {
  console.warn('⚠️  SMTP credentials not configured. Email sending disabled.');
}

export const sendPlanSelectionEmail = async (email, name, planName, planDetails) => {
  if (!transporter) return;

  const htmlContent = getPlansEmailTemplate(name, planName, planDetails);

  try {
    await transporter.sendMail({
      from: config.email.from_email,
      to: email,
      subject: `Plan ${planName} seleccionado - SynapseCode`,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Error sending plan selection email:', error);
  }
};

export const sendPaymentConfirmationEmail = async (
  email,
  name,
  planName,
  invoiceUrl,
  invoiceFilePath,
  amountPaid,
  currency = 'USD'
) => {
  if (!transporter) return;

  const formattedAmount = new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amountPaid || 0);

  const invoiceSection = invoiceUrl
    ? `<p>Se ha generado una factura para tu referencia:</p>
           <a href="${invoiceUrl}" class="invoice-link">Descargar Factura (PDF)</a>`
    : `<p>Actualmente no hay factura descargable disponible. Puedes consultar los detalles en tu panel de usuario o contactar soporte.</p>`;

  const planSummary = getPlanDetailsTable(planName);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background-color: #1e616d; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .invoice-link { display: inline-block; margin: 20px 0; padding: 10px 20px; background-color: #1e616d; color: white; text-decoration: none; border-radius: 5px; }
          .plans-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .plans-table th, .plans-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .plans-table th { background-color: #f5f5f5; }
          .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>¡Pago Confirmado!</h2>
          </div>
          <div class="content">
            <h3>¡Bienvenido/a ${name}!</h3>
            <p>Tu suscripción al plan <strong>${planName}</strong> ha sido confirmada.</p>
            <p><strong>Monto pagado:</strong> ${formattedAmount}</p>
            ${invoiceSection}
            <p>Puedes acceder a todos los beneficios del plan ${planName} inmediatamente.</p>
            ${planSummary}
            <p>Si tienes preguntas, no dudes en contactarnos.</p>
          </div>
          <div class="footer">
            <p>© 2026 SynapseCode. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: config.email.from_email,
      to: email,
      subject: `Pago confirmado - Plan ${planName}`,
      html: htmlContent,
      attachments: invoiceFilePath
        ? [
            {
              filename: `factura_synapsecode_${Date.now()}.pdf`,
              path: invoiceFilePath,
            },
          ]
        : [],
    });
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
  }
};

function getPlanDetailsTable(planName) {
  const planDetails = {
    FREE: {
      price: '$0/mes',
      features: 'Hasta 3 salas activas, hasta 5 usuarios por sala, ejecución de código básica, chat limitado, explicaciones con IA limitadas',
    },
    PRO: {
      price: '$20/mes',
      features: 'Salas ilimitadas, hasta 20 usuarios por sala, explicaciones con IA hasta 20, historial de versiones completo, ejecuciones prioritarias',
    },
    ORG: {
      price: '$50+/mes',
      features: 'Todo lo del PRO, panel de administración, analíticas por alumno, branding personalizado, soporte dedicado',
    },
  };

  const plan = planDetails[planName] || planDetails.FREE;

  return `
    <h3>Planes disponibles:</h3>
    <table class="plans-table">
      <tr>
        <th>Plan</th>
        <th>Precio</th>
        <th>Características</th>
      </tr>
      <tr>
        <td><strong>FREE</strong></td>
        <td>$0/mes</td>
        <td>• Hasta 3 salas activas<br>• Hasta 5 usuarios por sala<br>• Ejecución de código básica<br>• Chat limitado<br>• Explicaciones con IA limitadas</td>
      </tr>
      <tr>
        <td><strong>PRO</strong></td>
        <td>$20/mes</td>
        <td>• Salas ilimitadas<br>• Hasta 20 usuarios por sala<br>• Explicaciones con IA hasta 20<br>• Historial de versiones completo<br>• Ejecuciones prioritarias</td>
      </tr>
      <tr>
        <td><strong>ORG</strong></td>
        <td>$50+/mes</td>
        <td>• Todo lo del PRO<br>• Panel de administración<br>• Analíticas por alumno<br>• Branding personalizado<br>• Soporte dedicado</td>
      </tr>
      <tr>
        <td colspan="3"><strong>Plan activo:</strong> ${planName} — ${plan.price}</td>
      </tr>
    </table>
  `;
}


export const sendFreePlanEmail = async (email, name) => {
  if (!transporter) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background-color: #1e616d; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .plans-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .plans-table th, .plans-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .plans-table th { background-color: #f5f5f5; }
          .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>¡Bienvenido/a a SynapseCode!</h2>
          </div>
          <div class="content">
            <h3>Has seleccionado el Plan Gratuito</h3>
            <p>¡Gracias por elegir SynapseCode! Esperamos que disfrutes de nuestro plan gratuito.</p>
            
            <h3>Planes disponibles:</h3>
            <table class="plans-table">
              <tr>
                <th>Plan</th>
                <th>Precio</th>
                <th>Características</th>
              </tr>
              <tr>
                <td><strong>FREE</strong></td>
                <td>$0/mes</td>
                <td>
                  • Hasta 3 salas activas<br>
                  • Hasta 5 usuarios por sala<br>
                  • Ejecución de código básica<br>
                  • Chat limitado<br>
                  • Explicaciones con IA limitadas
                </td>
              </tr>
              <tr>
                <td><strong>PRO</strong></td>
                <td>$20/mes</td>
                <td>
                  • Salas ilimitadas<br>
                  • Hasta 20 usuarios por sala<br>
                  • Explicaciones con IA hasta 20<br>
                  • Historial de versiones completo<br>
                  • Ejecuciones prioritarias
                </td>
              </tr>
              <tr>
                <td><strong>ORG</strong></td>
                <td>$50+/mes</td>
                <td>
                  • Todo lo del PRO<br>
                  • Panel de administración<br>
                  • Analíticas por alumno<br>
                  • Branding personalizado<br>
                  • Soporte dedicado
                </td>
              </tr>
            </table>
            
            <p>Puedes cambiar de plan en cualquier momento desde tu panel de usuario.</p>
          </div>
          <div class="footer">
            <p>© 2026 SynapseCode. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: config.email.from_email,
      to: email,
      subject: 'Bienvenido/a a SynapseCode - Plan Gratuito',
      html: htmlContent,
    });
  } catch (error) {
    console.error('Error sending free plan email:', error);
  }
};

export const sendOrgApprovalRequestEmail = async (contractorEmail, professorEmail, professorName) => {
  if (!transporter) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background-color: #1e616d; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button { display: inline-block; margin: 20px 0; padding: 10px 20px; background-color: #1e616d; color: white; text-decoration: none; border-radius: 5px; }
          .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Solicitud de Aprobación de Profesor</h2>
          </div>
          <div class="content">
            <p>Ha llegado una solicitud de aprobación para el profesor:</p>
            <p><strong>Nombre:</strong> ${professorName}</p>
            <p><strong>Email:</strong> ${professorEmail}</p>
            <p>Ingresa a tu panel de administración para revisar y aprobar o rechazar esta solicitud.</p>
            <a href="${config.email.frontend_url}/org/approvals" class="button">Revisar Solicitud</a>
          </div>
          <div class="footer">
            <p>© 2026 SynapseCode. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: config.email.from_email,
      to: contractorEmail,
      subject: 'Nueva solicitud de aprobación de profesor',
      html: htmlContent,
    });
  } catch (error) {
    console.error('Error sending approval request email:', error);
  }
};

function getPlansEmailTemplate(name, planName, planDetails) {
  const planDescriptions = {
    FREE: {
      price: '$0',
      features: 'Hasta 3 salas activas, 5 usuarios por sala, ejecución básica, chat limitado, explicaciones con IA limitadas',
    },
    PRO: {
      price: '$20/mes',
      features: 'Salas ilimitadas, 20 usuarios por sala, explicaciones con IA hasta 20, historial completo, ejecuciones prioritarias',
    },
    ORG: {
      price: '$50+/mes',
      features: 'Todo lo del PRO + panel de administración, analíticas por alumno, branding personalizado, soporte dedicado',
    },
  };

  const plan = planDescriptions[planName] || {};

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background-color: #1e616d; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>¡Plan seleccionado: ${planName}!</h2>
          </div>
          <div class="content">
            <h3>Hola ${name},</h3>
            <p>¡Gracias por elegir el plan <strong>${planName}</strong>!</p>
            <p><strong>Precio:</strong> ${plan.price}</p>
            <p><strong>Características:</strong> ${plan.features}</p>
            <p>Ya puedes comenzar a usar todas las características de tu plan.</p>
          </div>
          <div class="footer">
            <p>© 2026 SynapseCode. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Enviar email de invitación a un participante (carnet) del plan ORG
 * @param {string} email - Email del participante
 * @param {string} studentName - Nombre del estudiante
 * @param {string} carnetNumber - Número de carnet
 * @param {string} institutionName - Nombre de la institución
 */
export const sendParticipantInvitationEmail = async (email, studentName, carnetNumber, institutionName = 'SynapseCode') => {
  if (!transporter) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background-color: #1e616d; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .carnet-box { background-color: #f0f0f0; border-left: 4px solid #1e616d; padding: 15px; margin: 20px 0; }
          .carnet-label { font-size: 12px; color: #666; text-transform: uppercase; }
          .carnet-number { font-size: 24px; font-weight: bold; color: #1e616d; margin: 10px 0; font-family: monospace; }
          .button { display: inline-block; margin: 20px 0; padding: 12px 24px; background-color: #1e616d; color: white; text-decoration: none; border-radius: 5px; }
          .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>¡Bienvenido a ${institutionName}!</h2>
          </div>
          <div class="content">
            <h3>Hola ${studentName},</h3>
            <p>Has sido invitado a participar en el plan ORG de <strong>${institutionName}</strong> en SynapseCode.</p>
            
            <p>Tu número de carnet para acceder es:</p>
            <div class="carnet-box">
              <div class="carnet-label">Número de Carnet</div>
              <div class="carnet-number">${String(carnetNumber).toUpperCase()}</div>
            </div>
            
            <p>Utiliza este número de carnet cuando ingreses a SynapseCode para acceder a todos los recursos del plan ORG.</p>
            
            <p><strong>Próximos pasos:</strong></p>
            <ol>
              <li>Dirígete a SynapseCode</li>
              <li>Ingresa con tu carnet: <strong>${String(carnetNumber).toUpperCase()}</strong></li>
              <li>¡Comienza a colaborar con tu institución!</li>
            </ol>
            
            <p>Si no esperabas este email, puedes ignorarlo.</p>
          </div>
          <div class="footer">
            <p>© 2026 SynapseCode. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: config.email.from_email,
      to: email,
      subject: `Invitación a ${institutionName} - SynapseCode`,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Error sending participant invitation email:', error);
  }
};

/**
 * Enviar email de confirmación cuando un participante se activa
 * @param {string} email - Email del participante
 * @param {string} studentName - Nombre del estudiante
 * @param {string} institutionName - Nombre de la institución
 */
export const sendParticipantConfirmationEmail = async (email, studentName, institutionName = 'SynapseCode') => {
  if (!transporter) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .success-box { background-color: #f0f8f0; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; margin: 20px 0; padding: 12px 24px; background-color: #1e616d; color: white; text-decoration: none; border-radius: 5px; }
          .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>✓ ¡Acceso Confirmado!</h2>
          </div>
          <div class="content">
            <h3>Hola ${studentName},</h3>
            <p>¡Tu acceso a <strong>${institutionName}</strong> en SynapseCode ha sido confirmado!</p>
            
            <div class="success-box">
              <p><strong>✓ Ya tienes acceso completo a:</strong></p>
              <ul>
                <li>Salas colaborativas de código</li>
                <li>Herramientas de ejecución y depuración</li>
                <li>Explicaciones con IA</li>
                <li>Análisis de tu progreso</li>
                <li>Interacción con profesores y compañeros</li>
              </ul>
            </div>
            
            <p>Puedes acceder a SynapseCode en cualquier momento usando tu número de carnet.</p>
            
            <a href="${config.email.frontend_url}/login" class="button">Ir a SynapseCode</a>
            
            <p>Si tienes preguntas, no dudes en contactar a los administradores de ${institutionName}.</p>
          </div>
          <div class="footer">
            <p>© 2026 SynapseCode. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: config.email.from_email,
      to: email,
      subject: `Acceso Confirmado - ${institutionName}`,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Error sending participant confirmation email:', error);
  }
};

export default {
  sendPlanSelectionEmail,
  sendPaymentConfirmationEmail,
  sendFreePlanEmail,
  sendOrgApprovalRequestEmail,
  sendParticipantInvitationEmail,
  sendParticipantConfirmationEmail,
};
