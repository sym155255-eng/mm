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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([fetchLinkDetail(id), fetchPublicData()]).then(([l, d]) => {
      if (!alive) return;
      setLink(l && !l.error ? l : null);
      setSettings(d.settings || {});
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
        <div style={s.headerInner}>
          <Link to="/" style={s.logo}>
            <span style={{ fontSize: 24 }}>{settings.site_logo || '🧭'}</span>
            <span style={{ fontWeight: 700 }}>{settings.site_title || '我的导航'}</span>
          </Link>
        </div>
      </header>

      <div style={s.body}>
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
  headerInner: { maxWidth: 800, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center' },
  logo: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--text)' },
  body: { maxWidth: 800, margin: '0 auto', padding: '16px 16px 40px' },
  crumb: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 13, color: '#6b7280', marginBottom: 14 },
  crumbLink: { color: 'var(--primary)', textDecoration: 'none' },
  sep: { color: '#d1d5db' },
  card: { background: '#fff', borderRadius: 14, padding: '24px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  titleRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 },
  icon: { width: 44, height: 44, borderRadius: 10, objectFit: 'contain', background: '#f5f5f5', flexShrink: 0 },
  title: { fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 },
  meta: { display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13, color: '#9ca3af', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f3f4f6' },
  desc: { fontSize: 15, color: '#374151', lineHeight: 1.7, marginBottom: 20 },
  openBtn: { background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 28px', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'block' },
  tag: { display: 'inline-block', background: '#eff2ff', color: 'var(--primary)', padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500 },
  subLink: { padding: '10px 20px', background: '#f7f8fa', borderRadius: 20, textDecoration: 'none', color: 'var(--primary)', fontSize: 15, whiteSpace: 'nowrap' },
  backBtn: { marginTop: 18, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer', color: '#374151' },
};
