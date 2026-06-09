import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchNavDetail, fetchPublicData } from '../api';

function applyTheme(s) {
  const root = document.documentElement;
  if (s.primary_color) root.style.setProperty('--primary', s.primary_color);
  if (s.bg_color) root.style.setProperty('--bg', s.bg_color);
}

export default function NavPage() {
  const { id } = useParams();
  const [nav, setNav] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([fetchNavDetail(id), fetchPublicData()]).then(([n, d]) => {
      if (!alive) return;
      setNav(n && !n.error ? n : null);
      setSettings(d.settings || {});
      applyTheme(d.settings || {});
      setLoading(false);
    });
    return () => { alive = false; };
  }, [id]);

  if (loading) return <div style={s.center}>加载中…</div>;
  if (!nav) return (
    <div style={s.center}>
      <p>页面不存在</p>
      <Link to="/" style={{ color: 'var(--primary)' }}>← 返回首页</Link>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={s.header}>
        <div style={s.headerInner}>
          <Link to="/" style={s.logo}>
            <span style={{ fontSize: 24 }}>{settings.site_logo || '🧭'}</span>
            <span style={{ fontWeight: 700 }}>{settings.site_title || '我的导航'}</span>
          </Link>
        </div>
      </header>

      <div style={s.body}>
        <div style={s.crumb}>
          <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>🏠 首页</Link>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span style={{ color: '#9ca3af' }}>{nav.title}</span>
        </div>

        <div style={s.card}>
          <h1 style={s.title}>{nav.icon ? `${nav.icon} ` : ''}{nav.title}</h1>
          {nav.content
            ? <div style={s.content} dangerouslySetInnerHTML={{ __html: nav.content }} />
            : <p style={{ color: '#9ca3af' }}>该页面暂无内容</p>
          }
          {nav.url && (
            <a href={nav.url} target="_blank" rel="noopener noreferrer" style={s.linkBtn}>前往链接 ›</a>
          )}
        </div>

        <Link to="/" style={s.backBtn}>← 返回首页</Link>
      </div>
    </div>
  );
}

const s = {
  center: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: '#6b7280', background: 'var(--bg)' },
  header: { background: '#fff', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10 },
  headerInner: { maxWidth: 860, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center' },
  logo: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--text)' },
  body: { maxWidth: 860, margin: '0 auto', padding: '16px 16px 40px' },
  crumb: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', marginBottom: 14 },
  card: { background: '#fff', borderRadius: 14, padding: '26px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  title: { fontSize: 24, fontWeight: 700, color: 'var(--text)', marginTop: 0, marginBottom: 18 },
  content: { fontSize: 15, color: '#374151', lineHeight: 1.8, wordBreak: 'break-word' },
  linkBtn: { display: 'inline-block', marginTop: 20, background: 'var(--primary)', color: '#fff', padding: '12px 24px', borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none' },
  backBtn: { display: 'inline-block', marginTop: 18, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 20px', fontSize: 14, color: '#374151', textDecoration: 'none' },
};
