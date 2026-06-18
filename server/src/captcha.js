const crypto = require('crypto');

// ===== 图形验证码（无依赖，内存存储，5分钟过期，一次性）=====
const store = new Map(); // token -> { text, expires }
const TTL = 5 * 60 * 1000;
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function cleanup() {
  const now = Date.now();
  for (const [k, v] of store) if (v.expires < now) store.delete(k);
}

function genSvg(text) {
  const W = 120, H = 44;
  const colors = ['#2563eb', '#dc2626', '#059669', '#7c3aed', '#d97706'];
  let parts = '';
  for (let i = 0; i < text.length; i++) {
    const x = 14 + i * 26 + (Math.random() * 6 - 3);
    const y = 30 + (Math.random() * 6 - 3);
    const rot = Math.random() * 40 - 20;
    const c = colors[Math.floor(Math.random() * colors.length)];
    parts += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="26" font-family="Arial,Helvetica,sans-serif" font-weight="bold" fill="${c}" transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})">${text[i]}</text>`;
  }
  let lines = '';
  for (let i = 0; i < 3; i++) {
    const c = colors[Math.floor(Math.random() * colors.length)];
    lines += `<line x1="${(Math.random()*W).toFixed(0)}" y1="${(Math.random()*H).toFixed(0)}" x2="${(Math.random()*W).toFixed(0)}" y2="${(Math.random()*H).toFixed(0)}" stroke="${c}" stroke-width="1" opacity="0.5"/>`;
  }
  let dots = '';
  for (let i = 0; i < 24; i++) dots += `<circle cx="${(Math.random()*W).toFixed(0)}" cy="${(Math.random()*H).toFixed(0)}" r="1" fill="#999" opacity="0.5"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#f1f3f6"/>${lines}${dots}${parts}</svg>`;
}

// 生成验证码，返回 { token, svg(dataURL) }
function issue() {
  cleanup();
  let text = '';
  for (let i = 0; i < 4; i++) text += CHARS[Math.floor(Math.random() * CHARS.length)];
  const token = crypto.randomBytes(16).toString('hex');
  store.set(token, { text, expires: Date.now() + TTL });
  return { token, svg: 'data:image/svg+xml;base64,' + Buffer.from(genSvg(text)).toString('base64') };
}

// 校验（一次性消费）。正确返回 true。
function verify(token, input) {
  cleanup();
  const rec = token && store.get(token);
  if (token) store.delete(token); // 一次性：无论对错都作废
  if (!rec || rec.expires < Date.now() || !input) return false;
  return String(input).toUpperCase() === rec.text;
}

module.exports = { issue, verify };
