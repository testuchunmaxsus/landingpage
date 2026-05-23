// Vercel Serverless Function — receives form, forwards to Telegram
// Env vars required: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const name = (body.name || '').toString().trim().slice(0, 200);
  const contact = (body.contact || '').toString().trim().slice(0, 200);
  const services = (body.services || '').toString().trim().slice(0, 300);
  const message = (body.message || '').toString().trim().slice(0, 2000);

  if (!name || !contact) {
    return res.status(400).json({ error: 'Ism va aloqa majburiy' });
  }

  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  console.log('Env check:', {
    hasToken: !!TOKEN,
    tokenLen: TOKEN ? TOKEN.length : 0,
    hasChatId: !!CHAT_ID,
    chatIdLen: CHAT_ID ? CHAT_ID.length : 0,
    keys: Object.keys(process.env).filter(k => k.startsWith('TELEGRAM')),
  });
  if (!TOKEN || !CHAT_ID) {
    return res.status(500).json({
      error: 'Server config missing',
      hasToken: !!TOKEN,
      hasChatId: !!CHAT_ID,
      foundTelegramKeys: Object.keys(process.env).filter(k => k.startsWith('TELEGRAM'))
    });
  }

  const esc = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const text =
    `🚀 <b>Yangi loyiha so'rovi</b>\n\n` +
    `<b>Ism:</b> ${esc(name)}\n` +
    `<b>Aloqa:</b> ${esc(contact)}\n` +
    `<b>Xizmatlar:</b> ${esc(services || 'ko\'rsatilmagan')}\n\n` +
    `<b>Xabar:</b>\n${esc(message || '(bo\'sh)')}`;

  try {
    const tg = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });
    const tgBody = await tg.text();
    if (!tg.ok) {
      console.error('Telegram API error:', tg.status, tgBody);
      return res.status(502).json({ error: 'Telegram send failed', status: tg.status, telegram: tgBody });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Send error:', e && e.message, e && e.stack);
    return res.status(500).json({ error: 'Internal error', detail: String(e && e.message) });
  }
}
