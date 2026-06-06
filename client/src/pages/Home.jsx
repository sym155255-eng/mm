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
  if (settings.color_ad_border)    root.style.setProperty('--ad-border',    settings.color_ad_border);
  if (settings.color_header_bg)    root.style.setProperty('--header-bg',    settings.color_header_bg);
  if (settings.color_site_title)   root.style.setProperty('--site-title',   settings.color_site_title);
  if (settings.color_footer)       root.style.setProperty('--footer',       settings.color_footer);
  if (settings.color_section_bg)   root.style.setProperty('--section-bg',   settings.color_section_bg);
  if (settings.color_tab_bg)       root.style.setProperty('--tab-bg',       settings.color_tab_bg);
  if (settings.color_tab_text)     root.style.setProperty('--tab-text',     settings.color_tab_text);
  if (settings.color_card_hover)   root.style.setProperty('--card-hover',   settings.color_card_hover);
  if (settings.color_icon_bg)      root.style.setProperty('--icon-bg',      settings.color_icon_bg);
  if (settings.color_badge)        root.style.setProperty('--badge',        settings.color_badge);
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
    // SSE 实时推送（反代不支持时会失败，由下面的轮询兜底）
    let es;
    try {
      es = new EventSource('/api/events');
      es.addEventListener('update', load);
    } catch {}
    // 轮询兜底：每 20 秒拉一次最新数据；切回页面时也立即刷新
    const timer = setInterval(load, 20000);
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      if (es) es.close();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  const { categories, links, settings, ads, subCategories = [], notices = [] } = data;
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
      <header className="site-header" style={styles.header}>
        <div className="header-inner" style={styles.headerInner}>
          <div className="header-logo" style={styles.logo}>
            <span style={{ fontSize: 28 }}>{settings.site_logo || '🧭'}</span>
            <div>
              <div style={styles.siteTitle}>{settings.site_title || '我的导航'}</div>
              <div style={styles.siteSubtitle}>{settings.site_subtitle || ''}</div>
            </div>
          </div>
          {/* 三条杠菜单（仅手机显示） */}
          <button className="hamburger-btn" style={styles.hamburger} onClick={() => setMenuOpen(v => !v)}>☰</button>
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
            <Link to="/login" style={styles.adminBtn}>登录</Link>
          </div>
        </div>
      </header>


      {/* 手机端抽屉遮罩 */}
      {menuOpen && <div className="home-drawer-overlay" onClick={() => setMenuOpen(false)} />}

      <div className="home-body" style={styles.body}>
        {/* Sidebar Categories（手机端为滑出抽屉） */}
        <aside className={`home-sidebar${menuOpen ? ' open' : ''}`} style={styles.sidebar}>
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
          {/* 抽屉底部：管理后台（仅手机抽屉显示） */}
          <Link to="/login" className="drawer-admin-btn" style={styles.drawerAdminBtn} onClick={() => setMenuOpen(false)}>
            🔑 登录
          </Link>
        </aside>


        {/* Main content */}
        <main style={styles.main}>
          {/* 跑马灯 */}
          {notices.length > 0 && (() => {
            const speed = parseFloat(settings.marquee_speed) || 30;
            const grad = settings.marquee_gradient;
            const gradOn = grad && grad.includes(',');
            const colors = gradOn ? grad.split(',') : [];
            // 首色追加到末尾，保证流光循环无缝
            const gradStr = gradOn ? `linear-gradient(90deg, ${[...colors, colors[0]].join(', ')})` : '';
            const gradVars = gradOn ? { '--grad': gradStr } : {};
            // 重复足够多次填满宽度，保证无缝
            let base = [...notices];
            while (base.length < 12) base = [...base, ...notices];
            const loopItems = [...base, ...base]; // 整体复制一份做无缝循环
            return (
              <div className="marquee-neon" style={styles.marquee}>
                <span style={styles.marqueeIcon}>📣</span>
                <div style={styles.marqueeViewport}>
                  <div className="marquee-track" style={{ ...styles.marqueeTrack, animationDuration: `${speed}s` }}>
                    {loopItems.map((n, i) => {
                      const itemStyle = { ...styles.marqueeItem, ...gradVars, ...(gradOn ? {} : { color: n.color || '#facc15' }) };
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

          {/* Ads */}
          {settings.show_ads === '1' && topAds.length > 0 && (
            <div style={styles.adsWrap}>
              {/* 标题栏 */}
              <div style={styles.adsHeader}>
                <div style={styles.adsHeaderLeft}>
                  <span style={styles.adsDot} />
                  <span style={styles.adsTitle}>{settings.ads_section_title || '精品推荐 / 赞助合作商'}</span>
                </div>
                <div style={styles.adsHeaderRight}>
                  <span style={styles.adsLabel}>SPONSORS AD</span>
                </div>
              </div>
              {/* 卡片横向滚动 */}
              <div className="ads-row" style={styles.adsRow}>
                {topAds.map(ad => (
                  <a key={ad.id} href={ad.url || '#'} target="_blank" rel="noopener noreferrer" style={styles.adCard}>
                    {ad.badge && (
                      <span style={{ ...styles.adBadge, background: ad.badge_color || 'var(--badge)' }}>{ad.badge}</span>
                    )}
                    <div style={styles.adCardIcon}>
                      {ad.image_url
                        ? <img src={ad.image_url} alt={ad.title} style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'contain' }} />
                        : <span style={{ fontSize: 18 }}>📢</span>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ ...styles.adCardTitle, ...(ad.title_color ? { color: ad.title_color } : {}) }}>{ad.title}</div>
                      {ad.description && (
                        <div style={{ ...styles.adCardDesc, ...(ad.desc_color ? { color: ad.desc_color } : {}) }}>{ad.description}</div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {grouped.length === 0 && uncategorized.length === 0 && (
            <div style={styles.empty}>暂无匹配结果</div>
          )}

          {grouped.map(({ cat, items }) => (
            <CategorySection
              key={cat.id}
              cat={cat}
              items={items}
              subCategories={subCategories.filter(sc => sc.category_id === cat.id)}
              onOpen={setPopup}
            />
          ))}

          {uncategorized.length > 0 && (
            <section className="fade-in" style={styles.section}>
              <div style={styles.sectionWrap}>
                <div style={styles.sectionHeader}>
                  <h2 style={styles.sectionTitle}>其他</h2>
                </div>
                <div className="link-grid" style={styles.grid}>
                  {uncategorized.map(link => <LinkCard key={link.id} link={link} onOpen={setPopup} />)}
                </div>
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

function CategorySection({ cat, items, subCategories, onOpen }) {
  const [activeTab, setActiveTab] = useState('all');
  const hasTabs = subCategories.length > 0;

  // 当前标签页下的链接
  const shownItems = !hasTabs || activeTab === 'all'
    ? items
    : items.filter(l => l.sub_category_id === activeTab);

  return (
    <section className="fade-in" style={styles.section}>
      <div style={styles.sectionWrap}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>{cat.name}</h2>
        </div>

        {/* 子分类标签页 */}
        {hasTabs && (
          <div style={styles.tabBar}>
            <button
              onClick={() => setActiveTab('all')}
              style={{ ...styles.tab, ...(activeTab === 'all' ? styles.tabActive : {}) }}
            >全部</button>
            {subCategories.map(sc => (
              <button
                key={sc.id}
                onClick={() => setActiveTab(sc.id)}
                style={{ ...styles.tab, ...(activeTab === sc.id ? styles.tabActive : {}) }}
              >{sc.name}</button>
            ))}
          </div>
        )}

        <div className="link-grid" style={styles.grid}>
          {shownItems.map(link => <LinkCard key={link.id} link={link} onOpen={onOpen} />)}
        </div>
        {shownItems.length === 0 && (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>该标签暂无链接</div>
        )}
      </div>
    </section>
  );
}

function LinkCard({ link, onOpen }) {
  const titleStyle = { ...styles.cardTitle, ...(link.title_color ? { color: link.title_color } : {}) };
  const descStyle  = { ...styles.cardDesc,  ...(link.desc_color  ? { color: link.desc_color  } : {}) };
  const hasSubs = link.sub_links && link.sub_links.length > 0;

  if (hasSubs) {
    return (
      <div onClick={() => onOpen(link)} style={{ ...styles.card, position: 'relative', cursor: 'pointer' }}>
        {link.badge && <span style={{ ...styles.badge, background: link.badge_color || 'var(--badge)' }}>{link.badge}</span>}
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
      {link.badge && <span style={{ ...styles.badge, background: link.badge_color || 'var(--badge)' }}>{link.badge}</span>}
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

function getDomain(url) {
  try { return new URL(url).hostname; }
  catch { return (url || '').replace(/^https?:\/\//, '').split('/')[0]; }
}

function FaviconImg({ url, title, icon }) {
  const domain = getDomain(url);
  // 多源依次尝试：用户自定义 → google → iowen → 网站自带 favicon
  const sources = [
    icon,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    `https://api.iowen.cn/favicon/${domain}.png`,
    `https://${domain}/favicon.ico`,
  ].filter(Boolean);

  const cacheKey = `fav:${domain}`;
  // 初始化：若本地缓存过成功的源，直接从它开始（跳过会失败的源）
  const [idx, setIdx] = useState(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached === '__fail__') return sources.length;        // 之前确认无图标 → 直接显示首字符
      const found = cached ? sources.indexOf(cached) : -1;
      return found >= 0 ? found : 0;
    } catch { return 0; }
  });

  function handleLoad() {
    try { localStorage.setItem(cacheKey, sources[idx]); } catch {}  // 记住成功的源
  }
  function handleError() {
    setIdx(i => {
      const next = i + 1;
      if (next >= sources.length) { try { localStorage.setItem(cacheKey, '__fail__'); } catch {} }
      return next;
    });
  }

  if (idx >= sources.length) {
    return <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>{title[0]}</span>;
  }
  return (
    <img
      src={sources[idx]}
      alt={title}
      width={24}
      height={24}
      onLoad={handleLoad}
      onError={handleError}
      style={{ borderRadius: 6, objectFit: 'contain' }}
    />
  );
}

const styles = {
  header: {
    background: 'var(--header-bg)',
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
  siteTitle: { fontWeight: 700, fontSize: 18, color: 'var(--site-title)' },
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
  marquee: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'linear-gradient(135deg, #1e1b2e, #2d2640)',
    border: '2px solid #a855f7',
    borderRadius: 999,
    padding: '12px 22px',
    marginBottom: 16,
    overflow: 'hidden',
  },
  marqueeIcon: { fontSize: 18, flexShrink: 0 },
  marqueeViewport: { flex: 1, overflow: 'hidden', position: 'relative' },
  marqueeTrack: { display: 'flex', width: 'max-content', gap: 48, whiteSpace: 'nowrap', willChange: 'transform' },
  marqueeItem: { fontSize: 15, fontWeight: 700, textDecoration: 'none' },
  adsWrap: {
    background: '#fff',
    borderRadius: 16,
    border: '1px solid #f0e6c8',
    padding: '20px 28px 22px',
    marginBottom: 14,
  },
  adsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  adsHeaderLeft: { display: 'flex', alignItems: 'center', gap: 7 },
  adsDot: {
    width: 9, height: 9,
    borderRadius: '50%',
    background: '#f59e0b',
    flexShrink: 0,
    boxShadow: '0 0 0 2px #fde68a',
  },
  adsTitle: { fontSize: 13, fontWeight: 700, color: '#78350f' },
  adsHeaderRight: { display: 'flex', alignItems: 'center', gap: 10 },
  adsLabel: { fontSize: 11, color: '#9ca3af', letterSpacing: 1 },
  adsRow: {
    display: 'grid',
    gap: 16,
  },
  adCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    background: 'var(--ad-bg, #fff)',
    border: '1.5px solid var(--ad-border)',
    borderRadius: 10,
    padding: '10px 14px',
    textDecoration: 'none',
    transition: 'box-shadow 0.2s, transform 0.15s',
    cursor: 'pointer',
    minWidth: 0,
  },
  adCardIcon: {
    width: 36, height: 36,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#fffbeb',
    borderRadius: 8,
    flexShrink: 0,
  },
  adCardTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--ad-title, #1a1a2e)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  adCardDesc: {
    fontSize: 11,
    color: 'var(--ad-desc, #6b7280)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginTop: 2,
  },
  adBadge: {
    position: 'absolute',
    top: 6, right: 6,
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    padding: '1px 6px',
    borderRadius: 4,
    lineHeight: 1.5,
    zIndex: 1,
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
  drawerAdminBtn: {
    display: 'none',   // 桌面隐藏，手机抽屉里显示
    margin: '8px',
    padding: '12px',
    background: 'var(--primary)',
    color: '#fff',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    textAlign: 'center',
    textDecoration: 'none',
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
  hamburger: {
    display: 'none',   // 桌面隐藏，App.css 媒体查询里手机显示
    background: '#f3f4f6',
    border: 'none',
    borderRadius: 10,
    width: 42,
    height: 42,
    fontSize: 20,
    color: '#374151',
    cursor: 'pointer',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileCatMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    background: '#fff',
    borderRadius: 12,
    padding: 8,
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    marginBottom: 4,
  },
  mobileMenuItem: {
    textAlign: 'left',
    padding: '11px 14px',
    borderRadius: 8,
    background: 'none',
    border: 'none',
    fontSize: 15,
    color: 'var(--text)',
    cursor: 'pointer',
  },
  mobileMenuActive: {
    background: 'var(--primary)',
    color: '#fff',
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
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--section-title)',
    marginBottom: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  sectionWrap: {
    background: 'var(--section-bg)',
    borderRadius: 16,
    padding: '24px 28px 28px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tabBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  tab: {
    padding: '7px 18px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    background: 'var(--tab-bg)',
    color: 'var(--tab-text)',
    transition: 'background 0.15s, color 0.15s',
  },
  tabActive: {
    background: 'var(--primary)',
    color: '#fff',
    fontWeight: 600,
  },
  grid: {
    display: 'grid',
    gap: 16,
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'var(--card-bg)',
    borderRadius: 10,
    padding: '10px 14px',
    border: '1px solid var(--card-border)',
    transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
    cursor: 'pointer',
    overflow: 'hidden',
    minWidth: 0,
    textDecoration: 'none',
  },
  cardIcon: {
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--icon-bg)',
    borderRadius: 8,
    flexShrink: 0,
  },
  cardContent: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--card-title)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 12,
    color: '#999',
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
    color: 'var(--footer)',
    fontSize: 13,
    borderTop: '1px solid var(--border)',
    background: 'var(--header-bg)',
  },
};
