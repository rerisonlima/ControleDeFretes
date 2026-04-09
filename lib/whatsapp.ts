import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_FROM; // e.g., 'whatsapp:+14155238886'
const toNumber = process.env.WHATSAPP_NOTIFICATION_NUMBER; // e.g., 'whatsapp:+5511999999999'

export async function sendWhatsAppNotification(tripData: any) {
  if (!accountSid || !authToken || !fromNumber || !toNumber) {
    console.warn('WhatsApp notification skipped: Twilio credentials not configured.');
    return;
  }

  const client = twilio(accountSid, authToken);

  const message = `
🚚 *Nova Viagem Cadastrada!*
--------------------------------
🆔 *ID:* ${tripData.tripId}
📅 *Data:* ${new Date(tripData.scheduledAt).toLocaleDateString('pt-BR')}
🚛 *Veículo:* ${tripData.vehicle?.plate || 'N/A'}
👤 *Motorista:* ${tripData.driver?.name || 'N/A'}
📍 *Destino:* ${tripData.frete?.cidade || 'N/A'}
📦 *Romaneio:* ${tripData.romaneio || 'N/A'}
💰 *Valor:* R$ ${tripData.value.toFixed(2)}
--------------------------------
_Cadastrado por: ${tripData.createdBy?.name || 'Sistema'}_
  `.trim();

  try {
    await client.messages.create({
      body: message,
      from: fromNumber,
      to: toNumber,
    });
    console.log('WhatsApp notification sent successfully.');
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error);
  }
}
