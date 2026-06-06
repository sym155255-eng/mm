const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../../data/icons');
fs.mkdirSync(ICONS_DIR, { recursive: true });

function getDomain(url) {
  try { return new URL(url).hostname; }
  catch { return (url || '').replace(/^https?:\/\//, '').split('/')[0]; }
}
function safeName(domain) {
  return domain.replace(/[^a-zA-Z0-9.-]/g, '_');
}

// 解析网页 HTML，找出网站声明的最佳图标（apple-touch-icon > 大尺寸 icon）
async function parseHtmlIcons(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } });
    clearTimeout(t);
    if (!res.ok) return [];
    const html = (await res.text()).slice(0, 60000); // 只看 <head> 区域
    const base = new URL(url);

    const icons = [];
    // 匹配所有 <link rel="...icon..." href="...">
    const re = /<link[^>]+rel=["']([^"']*icon[^"']*)["'][^>]*>/gi;
    let m;
    while ((m = re.exec(html))) {
      const tag = m[0];
      const rel = m[1].toLowerCase();
      const hrefM = tag.match(/href=["']([^"']+)["']/i);
      if (!hrefM) continue;
      let href = hrefM[1];
      try { href = new URL(href, base).href; } catch { continue; }
      const sizeM = tag.match(/sizes=["']?(\d+)/i);
      const size = sizeM ? parseInt(sizeM[1]) : (rel.includes('apple') ? 180 : 32);
      // 优先级：apple-touch-icon 最高，再按尺寸
      const priority = rel.includes('apple') ? 1000 + size : size;
      icons.push({ href, priority });
    }
    return icons.sort((a, b) => b.priority - a.priority).map(i => i.href);
  } catch { return []; }
}

// 下载一个图标 URL 到本地，成功返回本地路径
async function tryDownload(src, domain) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(src, { signal: ctrl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } });
    clearTimeout(t);
    if (!res.ok) return '';
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return '';
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100) return ''; // 太小多半是空图

    const ext = ct.includes('png') ? 'png' : ct.includes('jpeg') || ct.includes('jpg') ? 'jpg'
      : ct.includes('svg') ? 'svg' : ct.includes('webp') ? 'webp'
      : ct.includes('x-icon') || ct.includes('vnd.microsoft.icon') ? 'ico' : 'png';
    const filename = `${safeName(domain)}.${ext}`;
    fs.writeFileSync(path.join(ICONS_DIR, filename), buf);
    return `/icons/${filename}`;
  } catch { return ''; }
}

// 主函数：优先抓高清图标
async function fetchFavicon(url) {
  const domain = getDomain(url);
  if (!domain) return '';
  const fullUrl = url.startsWith('http') ? url : `https://${domain}`;

  // 1) 解析网页 HTML 拿网站声明的高清图标（apple-touch-icon 等）
  const htmlIcons = await parseHtmlIcons(fullUrl);

  // 2) 聚合/高清源兜底
  const fallbacks = [
    `https://unavatar.io/${domain}?fallback=false`,          // 多源聚合，质量最好
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,        // DuckDuckGo，清晰
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`, // Google 高分辨率
    `https://${domain}/apple-touch-icon.png`,                // 常见高清路径
    `https://${domain}/favicon.ico`,
  ];

  for (const src of [...htmlIcons, ...fallbacks]) {
    const local = await tryDownload(src, domain);
    if (local) return local;
  }
  return '';
}

module.exports = { fetchFavicon, ICONS_DIR };
