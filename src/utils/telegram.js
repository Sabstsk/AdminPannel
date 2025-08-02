// Utility for sending messages to Telegram
export async function sendToTelegram({ botToken, chatId, text }) {
  if (!botToken || !chatId || !text) return { ok: false, error: 'Missing botToken, chatId, or text' };
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
