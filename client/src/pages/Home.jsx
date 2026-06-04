import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchPublicData } from '../api';

function applyTheme(settings) {
  const root = document.documentElement;
  if (settings.primary_color)      root.style.setProperty('--primary',      settings.primary_color);
  if (settings.bg_color)           root.style.setProperty('--bg',           settings.bg_color);
  if (settings.color_card_title)   root.style.setProperty('--card-title',   settings.color_card_title);
  if (settings.color_card_desc)    root.style.setProperty('--card-desc',    settings.color_card_desc);
  if (settings.color_card_bg)      root.style.setProperty('--card-bg',      settings.color_card_bg);
  if (settings.color_card_border)  root.style.setProperty('--card-border',  settings.color_card_border);
  if (settings.color_section_title)root.style.setProperty('--section-title',settings.color_section_title);
  if (settings.color_ad_title)     root.style.setProperty('--ad-title',     settings.color_ad_title);
  if (settings.color_ad_desc)      root.style.setProperty('--ad-desc',      settings.color_ad_desc);
  if (settings.color_ad_bg)        root.style.setProperty('--ad-bg',        settings.color_ad_bg);
  if (settings.site_title) document.title = settings.site_title;
}

export default function Home() {
  const [data, setData] = useState({ categories: [], links: [], settings: {}, ads: [] });
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const [popup, setPopup] = useState(null); // link object

  const load = useCallback(async () => {
    const d = await fetchPublicData();
    setData(d);
    applyTheme(d.settings);
  }, []);

  useEffect(() => {
    load();
    const es = new EventSource('/api/events');
    es.addEventListener('update', load);
    return () => es.close();
  }, [load]);

  const { categories, links, settings, ads } = data;
  const topAds = ads.filter(a => a.position === 'top');

  const filteredLinks = links.filter(l => {
    const matchCat = activeCategory === 'all' || l.category_id === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q) || l.url.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const grouped = categories.reduce((acc, cat) => {
    if (activeCategory !== 'all' && cat.id !== activeCategory) return acc;
    const items = filteredLinks.filter(l => l.category_id === cat.id);
    if (items.length > 0) acc.push({ cat, items });
    return acc;
  }, []);

  const uncategorized = filteredLinks.filter(l => !l.category_id);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <span style={{ fontSize: 28 }}>{settings.site_logo || '🧭'}</span>
            <div>
              <div style={styles.siteTitle}>{settings.site_title || '我的导航'}</div>
              <div style={styles.siteSubtitle}>{settings.site_subtitle || ''}</div>
            </div>
          </div>
          {settings.show_search !== '0' && (
            <div style={styles.searchBox}>
              <span style={{ fontSize: 16, marginRight: 8, opacity: 0.4 }}>🔍</span>
              <input
                style={styles.searchInput}
                placeholder={settings.search_placeholder || '搜索网站...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && <button onClick={() => setSearch('')} style={styles.clearBtn}>✕</button>}
            </div>
          )}
          <div style={styles.headerRight}>
            <Link to="/admin" style={styles.adminBtn}>管理后台</Link>
          </div>
        </div>
      </header>


      <div style={styles.body}>
        {/* Sidebar Categories */}
        <aside style={{ ...styles.sidebar, display: menuOpen ? 'block' : undefined }}>
          <nav>
            <button
              style={{ ...styles.catItem, ...(activeCategory === 'all' ? styles.catActive : {}) }}
              onClick={() => { setActiveCategory('all'); setMenuOpen(false); }}
            >
              <span>🏠</span> 全部
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                style={{ ...styles.catItem, ...(activeCategory === cat.id ? styles.catActive : {}) }}
                onClick={() => { setActiveCategory(cat.id); setMenuOpen(false); }}
              >
                <span>{cat.icon}</span> {cat.name}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile category bar */}
        <div style={styles.mobileCatBar}>
          <button
            style={{ ...styles.mobileCatBtn, ...(activeCategory === 'all' ? styles.mobileCatActive : {}) }}
            onClick={() => setActiveCategory('all')}
          >全部</button>
          {categories.map(cat => (
            <button
              key={cat.id}
              style={{ ...styles.mobileCatBtn, ...(activeCategory === cat.id ? styles.mobileCatActive : {}) }}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Main content */}
        <main style={styles.main}>
          {/* Ads */}
          {settings.show_ads === '1' && topAds.length > 0 && (
            <div style={styles.adsBar}>
              {topAds.map(ad => (
                <a key={ad.id} href={ad.url || '#'} target="_blank" rel="noopener noreferrer" style={{ ...styles.adItem, position: 'relative' }}>
                  {ad.badge && (
                    <span style={{ ...styles.badge, background: ad.badge_color || '#ef4444' }}>{ad.badge}</span>
                  )}
                  <div style={styles.cardIcon}>
                    {ad.image_url
                      ? <img src={ad.image_url} alt={ad.title} style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'contain' }} />
                      : <span style={{ fontSize: 18, lineHeight: 1 }}>📢</span>
                    }
                  </div>
                  <div style={styles.cardContent}>
                    <div style={{ ...styles.adTitle, ...(ad.title_color ? { color: ad.title_color } : {}) }}>{ad.title}</div>
                    {ad.description && (
                      <div style={{ ...styles.adDesc, ...(ad.desc_color ? { color: ad.desc_color } : {}) }}>{ad.description}</div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}

          {grouped.length === 0 && uncategorized.length === 0 && (
            <div style={styles.empty}>暂无匹配结果</div>
          )}

          {grouped.map(({ cat, items }) => (
            <section key={cat.id} className="fade-in" style={styles.section}>
              <h2 style={styles.sectionTitle}><span>{cat.icon}</span> {cat.name}</h2>
              <div style={styles.grid}>
                {items.map(link => <LinkCard key={link.id} link={link} onOpen={setPopup} />)}
              </div>
            </section>
          ))}

          {uncategorized.length > 0 && (
            <section className="fade-in" style={styles.section}>
              <h2 style={styles.sectionTitle}><span>🔗</span> 其他</h2>
              <div style={styles.grid}>
                {uncategorized.map(link => <LinkCard key={link.id} link={link} onOpen={setPopup} />)}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <span>{settings.footer_text || '© 2025 我的导航'}</span>
      </footer>

      {/* 子链接弹窗 —— 挂在顶层，不受卡片布局影响 */}
      {popup && (
        <div style={styles.popupBg} onClick={() => setPopup(null)}>
          <div style={styles.popup} onClick={e => e.stopPropagation()}>
            <div style={styles.popupHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={styles.cardIcon}>
                  <FaviconImg url={popup.url} title={popup.title} icon={popup.icon} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{popup.title}</div>
                  {popup.description && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{popup.description}</div>}
                </div>
              </div>
              <button onClick={() => setPopup(null)} style={styles.popupClose}>✕</button>
            </div>
            <div style={styles.popupLinks}>
              <a href={popup.url} target="_blank" rel="noopener noreferrer" style={styles.popupItem} onClick={() => setPopup(null)}>
                <div style={{ ...styles.cardIcon, width: 28, height: 28 }}>
                  <FaviconImg url={popup.url} title={popup.title} icon={popup.icon} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--primary)' }}>{popup.title}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{popup.url}</div>
                </div>
                <span style={styles.popupTag}>主站</span>
              </a>
              <div style={{ height: 1, background: '#f3f4f6' }} />
              {popup.sub_links.map(sl => (
                <a key={sl.id} href={sl.url} target="_blank" rel="noopener noreferrer" style={styles.popupItem} onClick={() => setPopup(null)}>
                  <div style={{ ...styles.cardIcon, width: 28, height: 28 }}>
                    <FaviconImg url={sl.url} title={sl.title} icon={sl.icon} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{sl.title}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sl.url}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LinkCard({ link, onOpen }) {
  const titleStyle = { ...styles.cardTitle, ...(link.title_color ? { color: link.title_color } : {}) };
  const descStyle  = { ...styles.cardDesc,  ...(link.desc_color  ? { color: link.desc_color  } : {}) };
  const hasSubs = link.sub_links && link.sub_links.length > 0;

  if (hasSubs) {
    return (
      <div onClick={() => onOpen(link)} style={{ ...styles.card, position: 'relative', cursor: 'pointer' }}>
        {link.badge && <span style={{ ...styles.badge, background: link.badge_color || '#ef4444' }}>{link.badge}</span>}
        <div style={styles.cardIcon}>
          <FaviconImg url={link.url} title={link.title} icon={link.icon} />
        </div>
        <div style={styles.cardContent}>
          <div style={titleStyle}>{link.title}</div>
          {link.description && <div style={descStyle}>{link.description}</div>}
        </div>
      </div>
    );
  }

  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ ...styles.card, position: 'relative' }}>
      {link.badge && <span style={{ ...styles.badge, background: link.badge_color || '#ef4444' }}>{link.badge}</span>}
      <div style={styles.cardIcon}>
        <FaviconImg url={link.url} title={link.title} icon={link.icon} />
      </div>
      <div style={styles.cardContent}>
        <div style={titleStyle}>{link.title}</div>
        {link.description && <div style={descStyle}>{link.description}</div>}
      </div>
    </a>
  );
}

function FaviconImg({ url, title, icon }) {
  const [err, setErr] = useState(false);
  const src = icon || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=32`;
  if (err) return <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>{title[0]}</span>;
  return <img src={src} alt={title} width={20} height={20} onError={() => setErr(true)} style={{ borderRadius: 4, objectFit: 'contain' }} />;
}

const styles = {
  header: {
    background: 'var(--card-bg)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  },
  headerInner: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '0 20px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  siteTitle: { fontWeight: 700, fontSize: 18, color: 'var(--text)' },
  siteSubtitle: { fontSize: 12, color: 'var(--text-muted)' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto', flexShrink: 0 },
  adminBtn: {
    background: 'var(--primary)',
    color: '#fff',
    padding: '7px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    transition: 'opacity 0.2s',
  },
  adsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 12,
    marginBottom: 24,
  },
  adItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--ad-bg)',
    borderRadius: 10,
    padding: '12px 14px',
    border: '1px solid var(--card-border)',
    boxShadow: 'var(--shadow)',
    transition: 'box-shadow 0.2s, transform 0.2s',
    overflow: 'hidden',
  },
  adTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--ad-title)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  adDesc: {
    fontSize: 11,
    color: 'var(--ad-desc, var(--card-desc))',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginTop: 2,
  },
  subCount: {
    flexShrink: 0,
    background: '#eff2ff',
    color: 'var(--primary)',
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 10,
    marginLeft: 'auto',
  },
  popupBg: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 500,
    padding: 20,
  },
  popup: {
    background: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 380,
    boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
    overflow: 'hidden',
  },
  popupHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 18px',
    borderBottom: '1px solid #f3f4f6',
    background: '#fafafa',
  },
  popupClose: {
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '50%',
    width: 28,
    height: 28,
    cursor: 'pointer',
    fontSize: 12,
    color: '#6b7280',
    flexShrink: 0,
  },
  popupLinks: {
    padding: '8px 0',
    maxHeight: 360,
    overflowY: 'auto',
  },
  popupItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 18px',
    textDecoration: 'none',
    transition: 'background 0.15s',
    cursor: 'pointer',
  },
  popupTag: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--primary)',
    background: '#eff2ff',
    padding: '2px 6px',
    borderRadius: 6,
    flexShrink: 0,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 4,
    lineHeight: 1.4,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    zIndex: 1,
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    background: '#f3f4f6',
    border: '1.5px solid var(--border)',
    borderRadius: 40,
    padding: '8px 18px',
    flex: 1,
    maxWidth: 480,
    transition: 'border-color 0.2s, background 0.2s',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: 15,
    color: 'var(--text)',
  },
  clearBtn: {
    background: '#e5e7eb',
    border: 'none',
    borderRadius: '50%',
    width: 22,
    height: 22,
    fontSize: 11,
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '16px 20px 40px',
    display: 'flex',
    gap: 24,
    alignItems: 'flex-start',
  },
  sidebar: {
    width: 180,
    flexShrink: 0,
    background: '#fff',
    borderRadius: 'var(--radius)',
    padding: '12px 8px',
    boxShadow: 'var(--shadow)',
    position: 'sticky',
    top: 80,
    '@media(max-width:768px)': { display: 'none' },
  },
  catItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    background: 'none',
    border: 'none',
    fontSize: 14,
    color: 'var(--text)',
    cursor: 'pointer',
    transition: 'background 0.15s',
    textAlign: 'left',
  },
  catActive: {
    background: '#eff2ff',
    color: 'var(--primary)',
    fontWeight: 600,
  },
  mobileCatBar: {
    display: 'none',
  },
  mobileCatBtn: {
    padding: '6px 14px',
    borderRadius: 20,
    border: '1px solid var(--border)',
    background: '#fff',
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    color: 'var(--text)',
  },
  mobileCatActive: {
    background: 'var(--primary)',
    color: '#fff',
    borderColor: 'var(--primary)',
  },
  main: { flex: 1, minWidth: 0 },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--section-title)',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 12,
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--card-bg)',
    borderRadius: 10,
    padding: '12px 14px',
    border: '1px solid var(--card-border)',
    boxShadow: 'var(--shadow)',
    transition: 'box-shadow 0.2s, transform 0.2s',
    cursor: 'pointer',
    overflow: 'hidden',
  },
  cardIcon: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f3f4f6',
    borderRadius: 8,
    flexShrink: 0,
  },
  cardContent: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--card-title)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardDesc: {
    fontSize: 11,
    color: 'var(--card-desc)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    padding: '60px 0',
    color: 'var(--text-muted)',
    fontSize: 15,
  },
  footer: {
    textAlign: 'center',
    padding: '20px',
    color: 'var(--text-muted)',
    fontSize: 13,
    borderTop: '1px solid var(--border)',
    background: '#fff',
  },
};
