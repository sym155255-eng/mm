import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchPublicData } from '../api';

function applyTheme(s) {
  const root = document.documentElement;
  if (s.primary_color) root.style.setProperty('--primary', s.primary_color);
  if (s.bg_color) root.style.setProperty('--bg', s.bg_color);
}

function Icon({ link }) {
  if (link.icon) return <img src={link.icon} alt="" style={s.icoImg} onError={e => { e.target.style.display = 'none'; }} />;
  return <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{(link.title || '?').slice(0, 1).toUpperCase()}</span>;
}

export default function Page2() {
  const [data, setData] = useState({ categories: [], links: [], settings: {} });
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({}); // 各分类展开状态
  const [activeCat, setActiveCat] = useState('all'); // 选中的分类标签

  const load = useCallback(async () => {
    const d = await fetchPublicData();
    setData(d); applyTheme(d.settings || {}); setLoading(false);
  }, []);

  useEffect(() => {
    load();
    let es; try { es = new EventSource('/api/events'); es.addEventListener('update', load); } catch {}
    const t = setInterval(load, 20000);
    return () => { if (es) es.close(); clearInterval(t); };
  }, [load]);

  const { categories, links, settings, banners = [], notices = [], ads = [] } = data;
  const topAds = ads.filter(a => a.position === 'top');
  const kw = q.trim().toLowerCase();
  const shown = links.filter(l => !kw || (l.title || '').toLowerCase().includes(kw) || (l.description || '').toLowerCase().includes(kw) || (l.url || '').toLowerCase().includes(kw));
  const groups = categories.map(c => ({ cat: c, items: shown.filter(l => l.category_id === c.id) })).filter(g => g.items.length);

  const pageBg = settings.p2_bg ? { background: settings.p2_bg } : {};
  return (
    <div className="p2-page" style={{ ...s.page, ...pageBg }}>
      <header className="p2-header" style={s.header}>
        <div className="p2-head-inner" style={s.headInner}>
          <Link to="/" className="p2-brand" style={s.brand}>
            <span className="p2-brand-logo" style={{ fontSize: 26 }}>{settings.site_logo || '🧭'}</span>
            <span className="p2-brand-text" style={s.brandText}>{settings.site_title || '第二页'}</span>
          </Link>
          <input className="p2-search" style={s.search} placeholder="搜索…" value={q} onChange={e => setQ(e.target.value)} />
          <Link to="/" className="p2-back-btn" style={s.backBtn}>返回首页</Link>
        </div>
      </header>

      <div className="p2-body" style={s.body}>
        {/* 横幅图片 */}
        {banners.length > 0 && (
          <div className="p2-banners" style={s.banners}>
            {banners.map(b => (
              b.url
                ? <a key={b.id} href={b.url} target="_blank" rel="noopener noreferrer"><img className="p2-banner-img" src={b.image_url} alt="" style={s.bannerImg} /></a>
                : <img className="p2-banner-img" key={b.id} src={b.image_url} alt="" style={s.bannerImg} />
            ))}
          </div>
        )}

        {/* 跑马灯（首页同款霓虹流光） */}
        {notices.length > 0 && (() => {
          const speed = parseFloat(settings.marquee_speed) || 30;
          const grad = settings.marquee_gradient;
          const gradOn = grad && grad.includes(',');
          const colors = gradOn ? grad.split(',') : [];
          const gradStr = gradOn ? `linear-gradient(90deg, ${[...colors, colors[0]].join(', ')})` : '';
          const gradVars = gradOn ? { '--grad': gradStr } : {};
          let base = [...notices];
          while (base.length < 12) base = [...base, ...notices];
          const loop = [...base, ...base];
          return (
            <div className="marquee-neon p2-marquee" style={s.marquee}>
              <div className="p2-marquee-viewport" style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                <div className="marquee-track p2-marquee-track" style={{ display: 'flex', width: 'max-content', gap: 48, whiteSpace: 'nowrap', willChange: 'transform', animationDuration: `${speed}s` }}>
                  {loop.map((n, i) => {
                    const st = { fontSize: 14, fontWeight: 700, textDecoration: 'none', ...gradVars, ...(gradOn ? {} : { color: n.color || '#facc15' }) };
                    const cls = `p2-marquee-item${gradOn ? ' marquee-grad' : ''}`;
                    return n.url
                      ? <a key={i} className={cls} href={n.url} target="_blank" rel="noopener noreferrer" style={st}>{n.text}</a>
                      : <span key={i} className={cls} style={st}>{n.text}</span>;
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* 广告 */}
        {settings.show_ads === '1' && topAds.length > 0 && (
          <div className="p2-ads-row" style={s.adsRow}>
            {topAds.map(ad => (
              <a key={ad.id} className="p2-ad-card" href={ad.url || '#'} target="_blank" rel="noopener noreferrer" style={s.adCard}>
                <div className="p2-ad-ico" style={s.adIco}>
                  {ad.image_url
                    ? <img src={ad.image_url} alt="" style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'contain' }} />
                    : <span style={{ fontSize: 18 }}>📢</span>}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="p2-ad-title" style={s.adTitle}>{ad.title}{ad.badge && <span style={s.adBadge}>{ad.badge}</span>}</div>
                  {ad.description && <div className="p2-ad-desc" style={s.adDesc}>{ad.description}</div>}
                </div>
              </a>
            ))}
          </div>
        )}

        {/* 分类导航（标签切换：点哪个只显示哪个） */}
        {groups.length > 0 && (
          <div className="p2-cat-nav" style={s.catNav}>
            <button className="p2-cat-chip" style={{ ...s.catChip, ...(activeCat === 'all' ? s.catChipActive : {}) }} onClick={() => setActiveCat('all')}>🏠 全部</button>
            {groups.map(({ cat }) => (
              <button key={cat.id} className="p2-cat-chip" style={{ ...s.catChip, ...(activeCat === cat.id ? s.catChipActive : {}) }} onClick={() => setActiveCat(cat.id)}>
                <span>{cat.icon}</span>{cat.name}
              </button>
            ))}
          </div>
        )}

        {loading && <div style={s.tip}>加载中…</div>}
        {!loading && groups.length === 0 && (
          <div style={s.tip}>暂无内容，请在后台「2 → 分类管理 / 链接管理」中添加</div>
        )}

        {groups.filter(g => activeCat === 'all' || g.cat.id === activeCat).map(({ cat, items }) => {
          const cols = typeof window !== 'undefined' && window.innerWidth <= 768 ? 2
            : (typeof window !== 'undefined' && window.innerWidth <= 1024 ? 4 : 5);
          const limit = cols * 4; // 电脑 5×4=20
          const isOpen = !!expanded[cat.id];
          const hasMore = items.length > limit;
          const visible = isOpen ? items : items.slice(0, limit);
          return (
          <section key={cat.id} className="p2-section" id={`cat-${cat.id}`} style={s.section}>
            <h2 className="p2-section-title" style={{ ...s.secTitle, ...(settings.p2_section_color ? { color: settings.p2_section_color } : {}) }}>
              <span style={s.secBar} />{cat.icon} {cat.name}
              {hasMore && (
                <button className="p2-more-btn" style={s.moreBtn} onClick={() => setExpanded(e => ({ ...e, [cat.id]: !isOpen }))}>
                  {isOpen ? '收起 ▴' : '更多 ▾'}
                </button>
              )}
            </h2>
            <div className="p2-grid" style={s.grid}>
              {visible.map(l => (
                <a key={l.id} className="p2-card" href={l.url} target="_blank" rel="noopener noreferrer" style={s.card}>
                  <div className="p2-ico" style={s.ico}><Icon link={l} /></div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={s.titleRow}>
                      <span style={{ ...s.cardTitle, ...(settings.p2_card_title_color ? { color: settings.p2_card_title_color } : {}) }}>{l.title}</span>
                      {l.badge && <span style={{ ...s.badge, background: settings.p2_badge_color || l.badge_color || '#ef4444' }}>{l.badge}</span>}
                    </div>
                    {l.description && <div style={{ ...s.cardDesc, ...(settings.p2_card_desc_color ? { color: settings.p2_card_desc_color } : {}) }}>{l.description}</div>}
                  </div>
                </a>
              ))}
            </div>
          </section>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(180deg,#0f172a,#1e293b)', color: '#e2e8f0' },
  header: { background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #334155', position: 'sticky', top: 0, zIndex: 10 },
  headInner: { maxWidth: 1100, margin: '0 auto', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', gap: 14 },
  brand: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#fff', flexShrink: 0 },
  brandText: { fontWeight: 800, fontSize: 18 },
  search: { flex: '0 1 420px', margin: '0 auto', background: '#0b1220', border: '1px solid #334155', borderRadius: 22, padding: '9px 18px', color: '#e2e8f0', fontSize: 14, outline: 'none' },
  backBtn: { flexShrink: 0, color: '#94a3b8', textDecoration: 'none', fontSize: 13, border: '1px solid #334155', borderRadius: 8, padding: '7px 14px' },
  body: { maxWidth: 1100, margin: '0 auto', padding: '20px 16px 50px' },
  banners: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 },
  bannerImg: { width: '100%', display: 'block', borderRadius: 12 },
  marquee: { display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,#1e1b2e,#2d2640)', border: '2px solid #a855f7', borderRadius: 999, padding: '9px 16px', marginBottom: 18, overflow: 'hidden' },
  adsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10, marginBottom: 20 },
  adCard: { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(168,85,247,0.10)', border: '1px solid #6d28d9', borderRadius: 12, padding: '10px 14px', textDecoration: 'none', color: '#e2e8f0' },
  adIco: { width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  adTitle: { fontWeight: 600, fontSize: 14, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  adBadge: { fontSize: 10, fontWeight: 700, color: '#fff', background: 'var(--primary,#6366f1)', borderRadius: 4, padding: '1px 5px', flexShrink: 0 },
  adDesc: { fontSize: 12, color: '#a78bda', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  tip: { padding: 50, textAlign: 'center', color: '#64748b' },
  catNav: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22, background: 'rgba(255,255,255,0.04)', border: '1px solid #334155', borderRadius: 12, padding: 10 },
  catChip: { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.85)', border: '1px solid #cbd5e1', borderRadius: 20, padding: '6px 14px', fontSize: 13, color: '#222', textDecoration: 'none', cursor: 'pointer', transition: '.15s' },
  catChipActive: { background: 'var(--primary,#6366f1)', borderColor: 'var(--primary,#6366f1)', color: '#fff', fontWeight: 600 },
  section: { marginBottom: 26, scrollMarginTop: 72 },
  secTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 700, color: '#f1f5f9', margin: '0 0 14px' },
  secBar: { width: 4, height: 18, borderRadius: 2, background: 'var(--primary,#6366f1)', display: 'inline-block' },
  moreBtn: { marginLeft: 'auto', background: 'transparent', border: 'none', color: '#a5b4fc', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 12 },
  card: { display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', borderRadius: 14, padding: '14px 16px', textDecoration: 'none', color: '#e2e8f0', transition: 'transform .15s, background .15s' },
  ico: { width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 18 },
  icoImg: { width: 42, height: 42, objectFit: 'contain' },
  titleRow: { display: 'flex', alignItems: 'center', gap: 6 },
  cardTitle: { fontWeight: 600, fontSize: 15, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  badge: { fontSize: 10, fontWeight: 700, color: '#fff', borderRadius: 4, padding: '1px 5px', flexShrink: 0 },
  cardDesc: { fontSize: 12, color: '#94a3b8', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};
