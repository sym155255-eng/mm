import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchLinkDetail, fetchPublicData } from '../api';

function applyTheme(s) {
  const root = document.documentElement;
  if (s.primary_color) root.style.setProperty('--primary', s.primary_color);
  if (s.bg_color) root.style.setProperty('--bg', s.bg_color);
}

export default function SiteDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [link, setLink] = useState(null);
  const [settings, setSettings] = useState({});
  const [banners, setBanners] = useState([]);
  const [notices, setNotices] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([fetchLinkDetail(id), fetchPublicData()]).then(([l, d]) => {
      if (!alive) return;
      setLink(l && !l.error ? l : null);
      setSettings(d.settings || {});
      setBanners(d.banners || []);
      setNotices(d.notices || []);
      setAds((d.ads || []).filter(a => a.position === 'top'));
      applyTheme(d.settings || {});
      setLoading(false);
    });
    return () => { alive = false; };
  }, [id]);

  function openSite() {
    if (link?.url) window.open(link.url, '_blank', 'noopener,noreferrer');
  }

  if (loading) return <div style={s.center}>加载中…</div>;
  if (!link) return (
    <div style={s.center}>
      <p>链接不存在或已删除</p>
      <Link to="/" style={s.backLink}>← 返回首页</Link>
    </div>
  );

  const icon = link.icon || `https://www.google.com/s2/favicons?domain=${link.url}&sz=64`;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* 顶栏 */}
      <header style={s.header}>
        <div style={{ ...s.headerInner, justifyContent: 'space-between' }}>
          <Link to="/" style={s.logo}>
            <span style={{ fontSize: 24 }}>{settings.site_logo || '🧭'}</span>
            <span style={{ fontWeight: 700 }}>{settings.site_title || '我的导航'}</span>
          </Link>
          <button onClick={() => nav(-1)} style={s.headerBack}>← 返回</button>
        </div>
      </header>

      <div style={s.body}>
        {/* 横幅图片 */}
        {banners.length > 0 && (
          <div className="banner-wrap" style={s.bannerWrap}>
            {banners.map(b => (
              b.url
                ? <a key={b.id} href={b.url} target="_blank" rel="noopener noreferrer"><img src={b.image_url} alt="" style={s.bannerImg} /></a>
                : <img key={b.id} src={b.image_url} alt="" style={s.bannerImg} />
            ))}
          </div>
        )}

        {/* 跑马灯 */}
        {notices.length > 0 && (() => {
          const speed = parseFloat(settings.marquee_speed) || 30;
          const grad = settings.marquee_gradient;
          const gradOn = grad && grad.includes(',');
          const colors = gradOn ? grad.split(',') : [];
          const gradStr = gradOn ? `linear-gradient(90deg, ${[...colors, colors[0]].join(', ')})` : '';
          const gradVars = gradOn ? { '--grad': gradStr } : {};
          let base = [...notices];
          while (base.length < 12) base = [...base, ...notices];
          const loopItems = [...base, ...base];
          return (
            <div className="marquee-neon" style={s.marquee}>
              <div style={s.marqueeViewport}>
                <div className="marquee-track" style={{ ...s.marqueeTrack, animationDuration: `${speed}s` }}>
                  {loopItems.map((n, i) => {
                    const itemStyle = { ...s.marqueeItem, ...gradVars, ...(gradOn ? {} : { color: n.color || '#facc15' }) };
                    const cls = gradOn ? 'marquee-grad' : '';
                    return n.url
                      ? <a key={i} className={cls} href={n.url} target="_blank" rel="noopener noreferrer" style={itemStyle}>{n.text}</a>
                      : <span key={i} className={cls} style={itemStyle}>{n.text}</span>;
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* 广告 */}
        {settings.show_ads === '1' && ads.length > 0 && (
          <div style={s.adsWrap}>
            <div style={s.adsHeader}>
              <div style={s.adsHeaderLeft}>
                <span style={s.adsDot} />
                <span style={s.adsTitle}>{settings.ads_section_title || '精品推荐 / 赞助合作商'}</span>
              </div>
            </div>
            <div className={`ads-row${settings.mobile_ad_style === '2' ? ' ad-circle' : ''}${ads.length >= 10 ? ' ad-c5' : ' ad-c4'}`} style={s.adsRow}>
              {ads.map(ad => (
                <a key={ad.id} className="ad-card" href={ad.url || '#'} target="_blank" rel="noopener noreferrer" style={s.adCard}>
                  {ad.badge && (
                    <span style={{ ...s.adBadge, background: ad.badge_color || 'var(--badge)' }}>{ad.badge}</span>
                  )}
                  <div className="ad-ic" style={s.adCardIcon}>
                    {ad.image_url
                      ? <img src={ad.image_url} alt={ad.title} style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'contain' }} />
                      : <span style={{ fontSize: 18 }}>📢</span>}
                  </div>
                  <div className="ad-tx" style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...s.adCardTitle, ...(ad.title_color ? { color: ad.title_color } : {}) }}>{ad.title}</div>
                    {ad.description && (
                      <div style={{ ...s.adCardDesc, ...(ad.desc_color ? { color: ad.desc_color } : {}) }}>{ad.description}</div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 面包屑 */}
        <div style={s.crumb}>
          <Link to="/" style={s.crumbLink}>🏠 首页</Link>
          {link.category_name && <><span style={s.sep}>·</span><span>{link.category_name}</span></>}
          {link.sub_category_name && <><span style={s.sep}>·</span><span>{link.sub_category_name}</span></>}
          <span style={s.sep}>·</span><span style={{ color: '#9ca3af' }}>正文</span>
        </div>

        {/* 卡片 */}
        <div style={s.card}>
          <div className="detail-title-row" style={{ ...s.titleRow, flexWrap: 'wrap' }}>
            <img className="detail-icon" src={icon} alt="" style={s.icon} onError={e => e.target.style.visibility = 'hidden'} />
            <h1 className="detail-h1" style={s.title}>{link.title}</h1>
            {link.category_name && (
              <span className="detail-tag" style={s.tag}>📁 {link.sub_category_name || link.category_name}</span>
            )}
            <button className="detail-open-btn" style={s.openBtn} onClick={openSite}>打开网站 ›</button>
            {/* 子链接：与标题同一行；移动端单独占一行横向排列 */}
            {link.sub_links && link.sub_links.length > 0 && (
              <div className="detail-sub-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {link.sub_links.map(sl => (
                  <a key={sl.id} className="detail-sub-link" href={sl.url} target="_blank" rel="noopener noreferrer" style={s.subLink}>
                    🔗 {sl.title}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div style={s.meta}>
            <span>👁 {link.views || 0} 次浏览</span>
            {link.created_at && <span>🕒 收录于 {String(link.created_at).slice(0, 10)}</span>}
          </div>

          {link.description && <p style={s.desc}>{link.description}</p>}
        </div>

        <button onClick={() => nav(-1)} style={s.backBtn}>← 返回</button>
      </div>
    </div>
  );
}

const s = {
  center: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: '#6b7280', background: 'var(--bg)' },
  backLink: { color: 'var(--primary)', textDecoration: 'none' },
  header: { background: '#fff', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10 },
  headerInner: { maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center' },
  logo: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--text)' },
  body: { maxWidth: 1100, margin: '0 auto', padding: '16px 16px 40px' },
  crumb: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 13, color: '#6b7280', marginBottom: 14 },
  crumbLink: { color: 'var(--primary)', textDecoration: 'none' },
  sep: { color: '#d1d5db' },
  card: { background: '#fff', borderRadius: 14, padding: '16px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  titleRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 },
  icon: { width: 44, height: 44, borderRadius: 10, objectFit: 'contain', background: '#f5f5f5', flexShrink: 0 },
  title: { fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 },
  meta: { display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13, color: '#9ca3af', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' },
  desc: { fontSize: 15, color: '#374151', lineHeight: 1.7, marginBottom: 20 },
  openBtn: { background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'block' },
  tag: { display: 'inline-block', background: '#eff2ff', color: 'var(--primary)', padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500 },
  subLink: { padding: '10px 20px', background: '#f7f8fa', borderRadius: 20, textDecoration: 'none', color: 'var(--primary)', fontSize: 15, whiteSpace: 'nowrap' },
  backBtn: { marginTop: 18, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer', color: '#374151' },
  headerBack: { background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '6px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#374151', flexShrink: 0 },
  // 横幅
  bannerWrap: { display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 10, borderRadius: 10, overflow: 'hidden' },
  bannerImg: { width: '100%', height: 'auto', display: 'block' },
  // 跑马灯
  marquee: { display: 'flex', alignItems: 'center', gap: 12, background: 'linear-gradient(135deg, #1e1b2e, #2d2640)', border: '2px solid #a855f7', borderRadius: 999, padding: '6px 16px', marginBottom: 10, overflow: 'hidden' },
  marqueeViewport: { flex: 1, overflow: 'hidden', position: 'relative' },
  marqueeTrack: { display: 'flex', width: 'max-content', gap: 48, whiteSpace: 'nowrap', willChange: 'transform' },
  marqueeItem: { fontSize: 14, fontWeight: 700, textDecoration: 'none' },
  // 广告
  adsWrap: { background: '#fff', borderRadius: 16, border: '1px solid #f0e6c8', padding: '20px 28px 22px', marginBottom: 10 },
  adsHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  adsHeaderLeft: { display: 'flex', alignItems: 'center', gap: 7 },
  adsDot: { width: 9, height: 9, borderRadius: '50%', background: '#f59e0b', flexShrink: 0, boxShadow: '0 0 0 2px #fde68a' },
  adsTitle: { fontSize: 13, fontWeight: 700, color: '#78350f' },
  adsRow: { display: 'grid', gap: 16 },
  adCard: { display: 'flex', alignItems: 'center', gap: 12, position: 'relative', background: 'var(--ad-bg, #fff)', border: '1.5px solid var(--ad-border)', borderRadius: 10, padding: '10px 14px', textDecoration: 'none', cursor: 'pointer', minWidth: 0 },
  adCardIcon: { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fffbeb', borderRadius: 8, flexShrink: 0 },
  adCardTitle: { fontSize: 13, fontWeight: 700, color: 'var(--ad-title, #1a1a2e)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  adCardDesc: { fontSize: 11, color: 'var(--ad-desc, #6b7280)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 },
  adBadge: { position: 'absolute', top: 6, right: 6, color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, lineHeight: 1.5, zIndex: 1 },
};
