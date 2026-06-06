const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../../data/icons');
fs.mkdirSync(ICONS_DIR, { recursive: true });

function getDomain(url) {
  try { return new URL(url).hostname; }
  catch { return (url || '').replace(/^https?:\/\//, '').split('/')[0]; }
}

// 把域名转成安全的文件名
function safeName(domain) {
  return domain.replace(/[^a-zA-Z0-9.-]/g, '_');
}

// 依次尝试多个 favicon 源，下载第一个成功的图标到本地
async function fetchFavicon(url) {
  const domain = getDomain(url);
  if (!domain) return '';

  const sources = [
    `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    `https://api.iowen.cn/favicon/${domain}.png`,
    `https://${domain}/favicon.ico`,
    `https://favicon.im/${domain}`,
  ];

  for (const src of sources) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(src, { signal: ctrl.signal, redirect: 'follow' });
      clearTimeout(t);
      if (!res.ok) continue;

      const ct = res.headers.get('content-type') || '';
      if (!ct.startsWith('image/')) continue;

      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 100) continue; // 太小多半是空图/错误页

      const ext = ct.includes('png') ? 'png' : ct.includes('jpeg') || ct.includes('jpg') ? 'jpg'
        : ct.includes('svg') ? 'svg' : ct.includes('x-icon') || ct.includes('vnd.microsoft.icon') ? 'ico' : 'png';
      const filename = `${safeName(domain)}.${ext}`;
      fs.writeFileSync(path.join(ICONS_DIR, filename), buf);
      return `/icons/${filename}`; // 返回本地可访问路径
    } catch {
      continue;
    }
  }
  return ''; // 全失败，返回空，前端走兜底
}

module.exports = { fetchFavicon, ICONS_DIR };
