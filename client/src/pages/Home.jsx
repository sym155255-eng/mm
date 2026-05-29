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

function Marquee({ text, gradient, speed }) {
  const bg = GRADIENTS[gradient] || GRADIENTS.rainbow;
  const dur = `${Math.max(5, 60 - parseInt(speed || 30))}s`;
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
    <div className="ad-bar">
      {ads.map(ad => (
        <div
          key={ad.id}
          className="ad-card"
          style={{
            background: ad.bg_color || '#f8fafc',
            gridColumn: `span ${ad.columns || 1}`,
            cursor: ad.link ? 'pointer' : 'default',
          }}
          onClick={() => ad.link && window.open(ad.link, '_blank', 'noopener,noreferrer')}
        >
          <div className="ad-title-row">
            <span className="ad-title" style={ad.title_color ? { color: ad.title_color } : {}}>{ad.title}</span>
            {ad.badge && (
              <span className="ad-badge" style={{ '--ad-badge-bg': ad.badge_color || '#6366f1' }}>{ad.badge}</span>
            )}
          </div>
          {ad.description && <div className="ad-desc" style={ad.desc_color ? { color: ad.desc_color } : {}}>{ad.description}</div>}
        </div>
      ))}
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
      <div className="site-card-inner">
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
        <div className="site-info">
          <div className="site-title-row">
            <span className="site-title" style={link.title_color ? { color: link.title_color } : {}}>{link.title}</span>
            {link.badge && (
              <span className="card-badge" style={{ '--badge-bg': badgeColor }}>{link.badge}</span>
            )}
          </div>
          {link.description && (
            <div className="site-desc" style={link.desc_color ? { color: link.desc_color } : {}}>{link.description}</div>
          )}
        </div>
        {link.clicks > 0 && <span className="site-clicks">{link.clicks}</span>}
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
          {/* 移动端汉堡按钮，与搜索框同行 */}
          <button
            className="mobile-sidebar-toggle"
            onClick={() => setSidebarOpen(v => !v)}
            title="展开分类"
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

      <div className="main">
        {/* 移动端遮罩层 */}
        {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

        <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          {/* 移动端抽屉顶部 */}
          <div className="sidebar-drawer-header">
            <span className="sidebar-drawer-title">📂 分类导航</span>
            <button className="sidebar-close-btn" onClick={closeSidebar}>✕</button>
          </div>
          <div className="sidebar-title">分类</div>
          <ul className="category-list">
            <li
              className={`category-item ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => { setActiveCategory('all'); clearSearch(); closeSidebar(); }}
            >
              <span>🏠</span> 全部
            </li>
            {grouped.map(cat => (
              <li
                key={cat.id}
                className={`category-item ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => { setActiveCategory(cat.id); clearSearch(); closeSidebar(); }}
              >
                <span>{cat.icon}</span> {cat.name}
                <span className="cat-count">{cat.links.length}</span>
              </li>
            ))}
          </ul>

          {/* 移动端：侧边栏底部认证区 */}
          <div className="sidebar-auth-footer">
            {user ? (
              <>
                <span className="sidebar-auth-user">👤 {user.username}</span>
                {isAdmin && (
                  <Link to="/admin" className="sidebar-auth-btn sidebar-auth-admin" onClick={closeSidebar}>⚙️ 后台</Link>
                )}
                <button className="sidebar-auth-btn sidebar-auth-logout" onClick={() => { logout(); closeSidebar(); }}>退出</button>
              </>
            ) : (
              <>
                <Link to="/login"    className="sidebar-auth-btn sidebar-auth-login"    onClick={closeSidebar}>登录</Link>
                <Link to="/register" className="sidebar-auth-btn sidebar-auth-register" onClick={closeSidebar}>注册</Link>
              </>
            )}
          </div>
        </aside>


        <main className="content">
          {siteSettings.marquee_enabled === 'true' && siteSettings.marquee_text && (
            <Marquee
              text={siteSettings.marquee_text}
              gradient={siteSettings.marquee_gradient}
              speed={siteSettings.marquee_speed}
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
                    <span>{group.icon}</span> {group.name}
                    <span className="link-count">{group.links.length}</span>
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
