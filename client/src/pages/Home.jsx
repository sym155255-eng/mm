import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { linksApi, categoriesApi, settingsApi, adsApi } from '../api';
import { useAuth } from '../store/auth';
import { Link, useNavigate } from 'react-router-dom';

const emptyForm = { title: '', url: '', logo: '', description: '', category_id: '', badge: '', title_color: '', desc_color: '' };

// 颜色预设
const COLOR_PRESETS = [
  { label: '默认', value: '' },
  { label: '红', value: '#ef4444' },
  { label: '橙', value: '#f97316' },
  { label: '黄', value: '#eab308' },
  { label: '绿', value: '#22c55e' },
  { label: '青', value: '#06b6d4' },
  { label: '蓝', value: '#3b82f6' },
  { label: '紫', value: '#8b5cf6' },
  { label: '粉', value: '#ec4899' },
  { label: '深', value: '#1e293b' },
];

// 颜色选择器组件
function ColorField({ label, value, onChange }) {
  return (
    <div className="form-group">
      <label>{label} <span className="label-hint">（留空为默认颜色）</span></label>
      <div className="color-presets">
        {COLOR_PRESETS.map(c => (
          <div
            key={c.value}
            className={`color-dot ${value === c.value ? 'selected' : ''}`}
            style={{ background: c.value || '#e2e8f0', '--dot-border': c.value || '#94a3b8' }}
            title={c.label}
            onClick={() => onChange(c.value)}
          >
            {value === c.value && <span className="color-check">✓</span>}
          </div>
        ))}
        <input
          type="color"
          className="color-picker-input"
          value={value || '#000000'}
          onChange={e => onChange(e.target.value)}
          title="自定义颜色"
        />
      </div>
      {value && (
        <div className="color-preview-text" style={{ color: value }}>
          预览文字效果 · {label}
        </div>
      )}
    </div>
  );
}

// 角标预设
const BADGE_PRESETS = [
  { label: '推荐', color: '#ef4444' },
  { label: '热门', color: '#f97316' },
  { label: '新上线', color: '#8b5cf6' },
  { label: '必备', color: '#0ea5e9' },
  { label: '精选', color: '#22c55e' },
  { label: '限时', color: '#ec4899' },
];

// 跑马灯渐变色方案
const GRADIENTS = {
  rainbow:  'linear-gradient(90deg,#ff0080,#ff8c00,#ffe600,#00d26a,#00b4d8,#7c3aed,#ff0080)',
  sunset:   'linear-gradient(90deg,#f43f5e,#f97316,#facc15,#f43f5e)',
  ocean:    'linear-gradient(90deg,#06b6d4,#3b82f6,#8b5cf6,#06b6d4)',
  forest:   'linear-gradient(90deg,#22c55e,#84cc16,#10b981,#22c55e)',
  candy:    'linear-gradient(90deg,#ec4899,#a855f7,#6366f1,#ec4899)',
  gold:     'linear-gradient(90deg,#f59e0b,#fde68a,#d97706,#f59e0b)',
};

// 光谱色板：逐字/词上色
const SPECTRUM = [
  '#00f5ff', '#ff6eb4', '#ffe44d', '#b44fff',
  '#ff6b35', '#00ff99', '#ff3d7f', '#4dfff3',
  '#ffaa00', '#7b61ff', '#00e5ff', '#ff4fa3',
];

function Marquee({ text, gradient, speed, style: marqStyle }) {
  const dur = `${Math.max(8, 60 - parseInt(speed || 30))}s`;
  const isSpectrum = marqStyle === 'spectrum';

  if (isSpectrum) {
    const words = text.split(/\s+/).filter(Boolean);
    const coloredSegment = words.map((w, i) => (
      <span key={i} className="marquee-word" style={{ animationDelay: `${-(i * 0.4)}s` }}>{w}</span>
    ));
    return (
      <div className="marquee-wrap marquee-dark">
        <div className="marquee-track" style={{ animationDuration: dur }}>
          {[0, 1, 2].map(n => (
            <span key={n} className="marquee-segment">{coloredSegment}</span>
          ))}
        </div>
      </div>
    );
  }

  // 经典渐变样式
  const bg = GRADIENTS[gradient] || GRADIENTS.rainbow;
  return (
    <div className="marquee-wrap">
      <div className="marquee-track" style={{ animationDuration: dur }}>
        {[text, text, text].map((t, i) => (
          <span key={i} className="marquee-text" style={{ backgroundImage: bg }}>{t}&nbsp;&nbsp;&nbsp;⭐&nbsp;&nbsp;&nbsp;</span>
        ))}
      </div>
    </div>
  );
}

// 角标输入组件（复用于编辑/新增）
function BadgeField({ value, onChange }) {
  return (
    <div className="form-group">
      <label>角标文字 <span className="label-hint">（留空则不显示）</span></label>
      <div className="badge-presets">
        {BADGE_PRESETS.map(p => (
          <span
            key={p.label}
            className={`badge-preset-item ${value === p.label ? 'active' : ''}`}
            style={{ '--badge-color': p.color }}
            onClick={() => onChange(value === p.label ? '' : p.label)}
          >{p.label}</span>
        ))}
      </div>
      <input
        className="form-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="自定义角标文字，最多5字"
        maxLength={5}
      />
    </div>
  );
}

// 广告栏
function AdBar({ ads }) {
  if (!ads || ads.length === 0) return null;
  return (
    <div className="ad-section">
      {/* 标题行 */}
      <div className="ad-section-header">
        <div className="ad-section-title">
          <span className="ad-dot" />
          精品推荐 / 赞助合作商
        </div>
        <div className="ad-section-right">
          <span className="ad-sponsors-label">SPONSORS AD</span>
        </div>
      </div>
      {/* 卡片横向滚动行 */}
      <div className="ad-row">
        {ads.map(ad => {
          const logoSrc = ad.link
            ? (() => { try { return `https://favicon.yandex.net/favicon/${new URL(ad.link).hostname}`; } catch { return ''; } })()
            : '';
          return (
            <div
              key={ad.id}
              className="ad-new-card"
              style={{ borderColor: ad.bg_color || '#f59e0b', cursor: ad.link ? 'pointer' : 'default' }}
              onClick={() => ad.link && window.open(ad.link, '_blank', 'noopener,noreferrer')}
            >
              {ad.badge && (
                <span className="ad-new-badge" style={{ background: ad.badge_color || '#ef4444' }}>{ad.badge}</span>
              )}
              <div className="ad-new-inner">
                <div className="ad-new-logo">
                  {logoSrc
                    ? <img src={logoSrc} alt={ad.title} onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                    : null}
                  <div className="ad-new-logo-fallback" style={{ display: logoSrc ? 'none' : 'flex', background: ad.bg_color || '#f59e0b' }}>
                    {ad.title[0]}
                  </div>
                </div>
                <div className="ad-new-info">
                  <div className="ad-new-title" style={ad.title_color ? { color: ad.title_color } : {}}>{ad.title}</div>
                  {ad.description && <div className="ad-new-desc" style={ad.desc_color ? { color: ad.desc_color } : {}}>{ad.description}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 卡片编辑弹窗
function EditModal({ link, categories, onSave, onClose }) {
  const [form, setForm] = useState({
    title: link.title,
    url: link.url,
    logo: link.logo || '',
    description: link.description || '',
    category_id: link.category_id || '',
    badge: link.badge || '',
    title_color: link.title_color || '',
    desc_color: link.desc_color || '',
  });

  const handleSave = async e => {
    e.preventDefault();
    await onSave(link.id, form);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>✏️ 编辑导航</h3>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>网站名称 *</label>
            <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>网站地址 *</label>
            <input className="form-input" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://" required />
          </div>
          <div className="form-group">
            <label>Logo URL</label>
            <input className="form-input" value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))} placeholder="留空自动获取" />
          </div>
          <div className="form-group">
            <label>描述</label>
            <textarea className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          </div>
          <div className="form-group">
            <label>分类</label>
            <select className="form-input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
              <option value="">不分类</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <BadgeField value={form.badge} onChange={v => setForm(f => ({ ...f, badge: v }))} />
          <div className="color-fields-row">
            <ColorField label="网站名称颜色" value={form.title_color} onChange={v => setForm(f => ({ ...f, title_color: v }))} />
            <ColorField label="描述文字颜色" value={form.desc_color} onChange={v => setForm(f => ({ ...f, desc_color: v }))} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
            <button type="submit" className="btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 新增导航弹窗
function AddModal({ categories, onSave, onClose }) {
  const [form, setForm] = useState(emptyForm);
  const handleSave = async e => {
    e.preventDefault();
    await onSave(form);
    onClose();
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>➕ 新增导航</h3>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>网站名称 *</label>
            <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>网站地址 *</label>
            <input className="form-input" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://" required />
          </div>
          <div className="form-group">
            <label>Logo URL</label>
            <input className="form-input" value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))} placeholder="留空自动获取" />
          </div>
          <div className="form-group">
            <label>描述</label>
            <textarea className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          </div>
          <div className="form-group">
            <label>分类</label>
            <select className="form-input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
              <option value="">不分类</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <BadgeField value={form.badge} onChange={v => setForm(f => ({ ...f, badge: v }))} />
          <div className="color-fields-row">
            <ColorField label="网站名称颜色" value={form.title_color} onChange={v => setForm(f => ({ ...f, title_color: v }))} />
            <ColorField label="描述文字颜色" value={form.desc_color} onChange={v => setForm(f => ({ ...f, desc_color: v }))} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
            <button type="submit" className="btn-primary">添加</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 图标背景色（根据标题自动生成柔和色）
const ICON_BG = ['#dbeafe','#fce7f3','#dcfce7','#fef3c7','#ede9fe','#e0f2fe','#fee2e2','#fdf4ff'];
function getIconBg(str) {
  let h = 0;
  for (const c of str) h = (h << 5) - h + c.charCodeAt(0);
  return ICON_BG[Math.abs(h) % ICON_BG.length];
}

// 网站卡片（含管理员编辑覆盖层）
const SiteCard = memo(function SiteCard({ link, isAdmin, categories, onEdit, onDelete, onShowItems }) {
  const hasItems = link.items && link.items.length > 0;

  const handleClick = e => {
    if (e.target.closest('.card-admin-btns')) return;
    if (hasItems) { onShowItems(link); return; }
    linksApi.click(link.id).catch(() => {});
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  let logoSrc = link.logo;
  if (!logoSrc) {
    try { logoSrc = `https://favicon.yandex.net/favicon/${new URL(link.url).hostname}`; } catch { logoSrc = ''; }
  }

  const badgeColor = link.badge
    ? (BADGE_PRESETS.find(p => p.label === link.badge)?.color || '#6366f1')
    : null;

  return (
    <div className={`site-card ${isAdmin ? 'site-card-editable' : ''} ${hasItems ? 'site-card-has-items' : ''}`} onClick={handleClick} title={link.description}>
      {hasItems && <span className="card-items-dot" title="包含多个链接">▾</span>}
      {link.badge && (
        <span className="card-badge-top" style={{ '--badge-bg': badgeColor }}>{link.badge}</span>
      )}
      <div className="site-card-inner">
        <div className="site-logo-wrap" style={{ background: getIconBg(link.title) }}>
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={link.title}
              className="site-logo"
              loading="lazy"
              decoding="async"
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
          ) : null}
          <div className="site-logo-fallback" style={{ display: logoSrc ? 'none' : 'flex' }}>
            {link.title[0]}
          </div>
        </div>
        <div className="site-info">
          <div className="site-title-row">
            <span className="site-title" style={link.title_color ? { color: link.title_color } : {}}>{link.title}</span>
            {/* 桌面端保留行内角标 */}
            <span className="card-badge card-badge-inline" style={badgeColor ? { '--badge-bg': badgeColor } : { display: 'none' }}>{link.badge}</span>
          </div>
          {link.description && (
            <div className="site-desc" style={link.desc_color ? { color: link.desc_color } : {}}>{link.description}</div>
          )}
        </div>
      </div>
      {isAdmin && (
        <div className="card-admin-btns">
          <button className="card-edit-btn" onClick={e => { e.stopPropagation(); onEdit(link); }} title="编辑">✏️</button>
          <button className="card-delete-btn" onClick={e => { e.stopPropagation(); onDelete(link); }} title="删除">🗑️</button>
        </div>
      )}
    </div>
  );
});

// 子链接弹窗（独立于卡片，挂在页面顶层）
function ItemsModal({ link, onClose }) {
  if (!link) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="items-modal" onClick={e => e.stopPropagation()}>
        <div className="items-modal-title">
          <span>{link.title}</span>
          <button className="card-items-close" onClick={onClose}>✕</button>
        </div>
        <a className="items-modal-row" href={link.url} target="_blank" rel="noopener noreferrer"
          onClick={() => linksApi.click(link.id).catch(() => {})}>
          🏠 <span>主链接</span>
        </a>
        {link.items.map(item => (
          <a key={item.id} className="items-modal-row" href={item.url} target="_blank" rel="noopener noreferrer"
            onClick={() => linksApi.click(link.id).catch(() => {})}>
            🔗 <span>{item.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// 回到顶部按钮
function BackTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = document.querySelector('.content');
    if (!el) return;
    const onScroll = () => setShow(el.scrollTop > 300);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  return (
    <button className="back-top" onClick={() => document.querySelector('.content')?.scrollTo({ top: 0, behavior: 'smooth' })} title="回到顶部">
      ↑
    </button>
  );
}

export default function Home() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [grouped, setGrouped] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchResult, setSearchResult] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingLink, setEditingLink] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [siteSettings, setSiteSettings] = useState({
    site_name: '导航站', site_icon: '🧭', site_desc: '收录优质网站', site_footer: '© 导航站 · 收录优质网站'
  });
  const [adList, setAdList] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [topnavMenuOpen, setTopnavMenuOpen] = useState(false);
  const [itemsLink, setItemsLink] = useState(null);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const reload = () => {
    setLoading(true);
    linksApi.getGrouped()
      .then(res => setGrouped(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    categoriesApi.getAll().then(res => setCategories(res.data || []));
    settingsApi.get().then(res => { if (res.data) setSiteSettings(res.data); });
    adsApi.getEnabled().then(res => setAdList(res.data || []));
  }, []);

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    if (!keyword.trim()) { setSearchResult(null); return; }
    setLoading(true);
    try {
      const res = await linksApi.getList({ keyword: keyword.trim(), size: 50 });
      setSearchResult(res.data || []);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  const clearSearch = () => { setKeyword(''); setSearchResult(null); };

  const handleEditSave = useCallback(async (id, form) => {
    await linksApi.update(id, form);
    reload();
    if (searchResult) {
      const res = await linksApi.getList({ keyword: keyword.trim(), size: 50 });
      setSearchResult(res.data || []);
    }
  }, [searchResult, keyword]);

  const handleDelete = useCallback(async (link) => {
    if (!confirm(`确认删除「${link.title}」？`)) return;
    await linksApi.delete(link.id);
    reload();
  }, []);

  const handleAddSave = useCallback(async (form) => {
    await linksApi.create(form);
    reload();
  }, []);

  const displayGroups = searchResult
    ? [{ id: 'search', name: '搜索结果', icon: '🔍', links: searchResult }]
    : activeCategory === 'all'
      ? grouped
      : grouped.filter(g => g.id === parseInt(activeCategory));

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">{siteSettings.site_icon}</span>
            <span className="logo-text">{siteSettings.site_name}</span>
          </div>
          {/* 移动端汉堡按钮 */}
          <button
            className="mobile-sidebar-toggle"
            onClick={() => siteSettings.site_layout === 'topnav'
              ? setTopnavMenuOpen(v => !v)
              : setSidebarOpen(v => !v)}
            title="菜单"
          >☰</button>
          <form className="search-form" onSubmit={handleSearch}>
            <input
              className="search-input"
              placeholder="搜索网站..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
            <button className="search-btn" type="submit">搜索</button>
            {searchResult && (
              <button className="clear-btn" type="button" onClick={clearSearch}>✕ 清除</button>
            )}
          </form>
          <nav className="header-nav">
            {user ? (
              <>
                <span className="user-name">👤 {user.username}</span>
                {isAdmin && (
                  <>
                    <button className="nav-btn-add" onClick={() => setShowAddModal(true)}>＋ 新增</button>
                    <Link to="/admin" className="nav-link admin-link">⚙️ 后台管理</Link>
                  </>
                )}
                <button className="nav-btn" onClick={logout}>退出</button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">登录</Link>
                <Link to="/register" className="nav-link nav-link-primary">注册</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* 顶部分类导航栏（topnav 模式） */}
      {siteSettings.site_layout === 'topnav' && (
        <div className="cat-nav-bar">
          <div className="cat-nav-inner">
            <button
              className={`cat-nav-item ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => { setActiveCategory('all'); clearSearch(); }}
            >
              <span className="cat-nav-icon">🏠</span> 全部
            </button>
            {grouped.map(cat => (
              <button
                key={cat.id}
                className={`cat-nav-item ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => { setActiveCategory(cat.id); clearSearch(); }}
              >
                <span className="cat-nav-icon">{cat.icon}</span> {cat.name}
                <span className="cat-nav-count">{cat.links.length}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* topnav 模式 — 移动端菜单小抽屉 */}
      {topnavMenuOpen && (
        <>
          <div className="topnav-menu-overlay" onClick={() => setTopnavMenuOpen(false)} />
          <div className="topnav-menu-drawer">
            <div className="topnav-menu-header">
              <span>菜单</span>
              <button onClick={() => setTopnavMenuOpen(false)}>✕</button>
            </div>
            {/* 分类列表 */}
            <div className="topnav-menu-cats">
              <button
                className={`topnav-menu-cat ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => { setActiveCategory('all'); clearSearch(); setTopnavMenuOpen(false); }}
              >🏠 全部</button>
              {grouped.map(cat => (
                <button
                  key={cat.id}
                  className={`topnav-menu-cat ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => { setActiveCategory(cat.id); clearSearch(); setTopnavMenuOpen(false); }}
                >
                  {cat.icon} {cat.name}
                  <span className="topnav-menu-cat-count">{cat.links.length}</span>
                </button>
              ))}
            </div>
            <div className="topnav-menu-divider" />
            {user ? (
              <>
                <span className="topnav-menu-user">👤 {user.username}</span>
                {isAdmin && <Link to="/admin" className="topnav-menu-item topnav-menu-admin" onClick={() => setTopnavMenuOpen(false)}>⚙️ 后台管理</Link>}
                {isAdmin && <button className="topnav-menu-item topnav-menu-add" onClick={() => { setShowAddModal(true); setTopnavMenuOpen(false); }}>＋ 新增导航</button>}
                <button className="topnav-menu-item topnav-menu-logout" onClick={() => { logout(); setTopnavMenuOpen(false); }}>退出登录</button>
              </>
            ) : (
              <>
                <Link to="/login" className="topnav-menu-item" onClick={() => setTopnavMenuOpen(false)}>登录</Link>
                <Link to="/register" className="topnav-menu-item topnav-menu-reg" onClick={() => setTopnavMenuOpen(false)}>注册</Link>
              </>
            )}
          </div>
        </>
      )}

      <div className={`main ${siteSettings.site_layout === 'topnav' ? 'main-topnav' : 'main-sidebar'}`}>

        {/* 左侧边栏（sidebar 模式） */}
        {siteSettings.site_layout !== 'topnav' && (
          <>
            {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}
            <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
              <div className="sidebar-drawer-header">
                <span className="sidebar-drawer-title">📂 分类导航</span>
                <button className="sidebar-close-btn" onClick={closeSidebar}>✕</button>
              </div>
              <div className="sidebar-title">分类</div>
              <ul className="category-list">
                <li className={`category-item ${activeCategory === 'all' ? 'active' : ''}`}
                  onClick={() => { setActiveCategory('all'); clearSearch(); closeSidebar(); }}>
                  <span>🏠</span> 全部
                </li>
                {grouped.map(cat => (
                  <li key={cat.id}
                    className={`category-item ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => { setActiveCategory(cat.id); clearSearch(); closeSidebar(); }}>
                    <span>{cat.icon}</span> {cat.name}
                    <span className="cat-count">{cat.links.length}</span>
                  </li>
                ))}
              </ul>
              <div className="sidebar-auth-footer">
                {user ? (
                  <>
                    <span className="sidebar-auth-user">👤 {user.username}</span>
                    {isAdmin && <Link to="/admin" className="sidebar-auth-btn sidebar-auth-admin" onClick={closeSidebar}>⚙️ 后台</Link>}
                    <button className="sidebar-auth-btn sidebar-auth-logout" onClick={() => { logout(); closeSidebar(); }}>退出</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="sidebar-auth-btn sidebar-auth-login" onClick={closeSidebar}>登录</Link>
                    <Link to="/register" className="sidebar-auth-btn sidebar-auth-register" onClick={closeSidebar}>注册</Link>
                  </>
                )}
              </div>
            </aside>
          </>
        )}

        <main className="content">
          {siteSettings.marquee_enabled === 'true' && siteSettings.marquee_text && (
            <Marquee
              text={siteSettings.marquee_text}
              gradient={siteSettings.marquee_gradient}
              speed={siteSettings.marquee_speed}
              style={siteSettings.marquee_style || 'classic'}
            />
          )}
          <AdBar ads={adList} />
          {isAdmin && (
            <div className="admin-tip-bar">
              ✏️ 管理员模式 · 悬停卡片可编辑/删除
              <button className="tip-add-btn" onClick={() => setShowAddModal(true)}>＋ 新增导航</button>
            </div>
          )}
          {loading ? (
            <div className="loading">加载中...</div>
          ) : displayGroups.length === 0 ? (
            <div className="empty">暂无数据</div>
          ) : (
            displayGroups.map(group => (
              group.links.length > 0 && (
                <section key={group.id} className="category-section" id={`cat-${group.id}`}>
                  <h2 className="category-title">
                    {group.name}
                  </h2>
                  <div className="sites-grid">
                    {group.links.map(link => (
                      <SiteCard
                        key={link.id}
                        link={link}
                        isAdmin={isAdmin}
                        categories={categories}
                        onEdit={setEditingLink}
                        onDelete={handleDelete}
                        onShowItems={setItemsLink}
                      />
                    ))}
                  </div>
                </section>
              )
            ))
          )}
        </main>
      </div>

      <ItemsModal link={itemsLink} onClose={() => setItemsLink(null)} />
      <BackTop />
      <footer className="footer">
        <p>{siteSettings.site_footer}</p>
      </footer>

      {editingLink && (
        <EditModal
          link={editingLink}
          categories={categories}
          onSave={handleEditSave}
          onClose={() => setEditingLink(null)}
        />
      )}
      {showAddModal && (
        <AddModal
          categories={categories}
          onSave={handleAddSave}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
