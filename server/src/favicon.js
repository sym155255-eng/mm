const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../../data/icons');
fs.mkdirSync(ICONS_DIR, { recursive: true });

// 忽略自签名证书的 agent（IP/内网站点常用自签证书）
let insecureAgent = null;
try {
  const { Agent } = require('undici');
  insecureAgent = new Agent({ connect: { rejectUnauthorized: false } });
} catch {}
function fetchOpts(extra = {}) {
  const o = { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' }, ...extra };
  if (insecureAgent) o.dispatcher = insecureAgent;
  return o;
}

function getDomain(url) {
  try { return new URL(url).hostname; }
  catch { return (url || '').replace(/^https?:\/\//, '').split('/')[0]; }
}
// 完整 origin（含端口），用于直接从站点抓取
function getOrigin(url) {
  try { return new URL(url).origin; }
  catch { return url.startsWith('http') ? url.split('/').slice(0, 3).join('/') : `https://${url}`; }
}
// 是否为 IP 地址（这类站点用不了第三方 favicon 服务）
function isIP(host) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':') === false && /^[0-9.]+$/.test(host);
}
function safeName(domain) {
  return domain.replace(/[^a-zA-Z0-9.-]/g, '_');
}

// 解析网页 HTML，找出网站声明的最佳图标（apple-touch-icon > 大尺寸 icon）
async function parseHtmlIcons(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, fetchOpts({ signal: ctrl.signal }));
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
    const res = await fetch(src, fetchOpts({ signal: ctrl.signal }));
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
  const origin = getOrigin(fullUrl);   // 含端口，如 https://1.2.3.4:52524
  const ipLike = isIP(domain);

  // 1) 解析网页 HTML 拿网站声明的图标（IP:端口 站点也能用，含端口）
  const htmlIcons = await parseHtmlIcons(fullUrl);

  // 2) 直接从站点本身抓（IP/端口 站点唯一可行的方式）
  const directSources = [
    `${origin}/apple-touch-icon.png`,
    `${origin}/apple-touch-icon-precomposed.png`,
    `${origin}/favicon.ico`,
    `${origin}/favicon.png`,
  ];

  // 3) 第三方聚合服务（只对真实域名有效，IP 跳过）
  const thirdParty = ipLike ? [] : [
    `https://unavatar.io/${domain}?fallback=false`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ];

  // IP 站点优先直连，域名站点优先 HTML+第三方
  const order = ipLike
    ? [...htmlIcons, ...directSources]
    : [...htmlIcons, ...thirdParty, ...directSources];

  for (const src of order) {
    const local = await tryDownload(src, domain);
    if (local) return local;
  }
  return '';
}

module.exports = { fetchFavicon, ICONS_DIR };
