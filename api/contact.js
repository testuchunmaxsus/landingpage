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
  if (!TOKEN || !CHAT_ID) {
    console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID env vars');
    return res.status(500).json({ error: 'Server config missing' });
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
    if (!tg.ok) {
      const errTxt = await tg.text();
      console.error('Telegram API error:', errTxt);
      return res.status(502).json({ error: 'Telegram send failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Send error:', e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
