import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const emailFrom = process.env.EMAIL_FROM || 'noreply@fleetmanagement.com';
const emailTo = process.env.NOTIFICATION_EMAIL_RECIPIENT;

export async function sendEmailNotification(tripData: any) {
  console.log('Attempting to send email notification to:', emailTo);
  
  if (!smtpHost || !smtpUser || !smtpPass || !emailTo) {
    console.warn('Email notification skipped: Missing configuration.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const destination = tripData.frete?.cidade || tripData.route?.destination || 'N/A';
  const subject = `🚚 Nova Viagem Cadastrada - Destino: ${destination}`;
  
  const htmlContent = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Nova Viagem Cadastrada</h1>
      </div>
      <div style="padding: 20px;">
        <p>Uma nova viagem foi registrada no sistema por um operador.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">ID da Viagem:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${tripData.tripId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Data:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${new Date(tripData.scheduledAt).toLocaleDateString('pt-BR')}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Contratante:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${tripData.contratante?.ContratanteNome || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Veículo:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${tripData.vehicle?.plate || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Motorista:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${tripData.driver?.name || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Destino:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${tripData.frete?.cidade || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Romaneio:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${tripData.romaneio || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Valor:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">R$ ${tripData.value.toFixed(2)}</td>
          </tr>
        </table>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          Cadastrado por: ${tripData.createdBy?.name || 'Sistema'}
        </p>
      </div>
      <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 11px; color: #999;">
        Este é um e-mail automático enviado pelo Sistema de Gestão de Frota.
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Gestão de Frota'}" <${emailFrom}>`,
      to: emailTo,
      subject: subject,
      html: htmlContent,
    });
    console.log('Email notification sent successfully.');
  } catch (error) {
    console.error('Failed to send email notification:', error);
  }
}
