import { useEffect, useState, useRef } from 'react';
import { linksApi, adsApi, categoriesApi } from '../../api';

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

// 颜色弹出面板（自动判断向上/向下弹出）
function ColorPopover({ value, onChange, onClose }) {
  const ref = useRef(null);
  const [openUp, setOpenUp] = useState(false);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    if (rect.bottom > window.innerHeight - 20) setOpenUp(true);
  }, []);

  return (
    <div className="tc-popover" ref={ref} style={openUp ? { top: 'auto', bottom: 'calc(100% + 8px)' } : {}}>
      <div className="tc-pop-presets">
        {COLOR_PRESETS.map(c => (
          <div
            key={c.value}
            className={`tc-pop-dot ${value === c.value ? 'active' : ''}`}
            style={{ background: c.value || '#e2e8f0', '--dot-border': c.value || '#94a3b8' }}
            title={c.label}
            onClick={() => { onChange(c.value); onClose(); }}
          >
            {value === c.value && <span className="color-check">✓</span>}
          </div>
        ))}
      </div>
      <label className="tc-pop-custom">
        <span>自定义</span>
        <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)} />
      </label>
    </div>
  );
}

// 单个颜色格子
function ColorCell({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="tc-color-cell">
      <div
        className="tc-swatch"
        style={{ background: value || '#e2e8f0', border: value ? `2px solid ${value}` : '2px solid #cbd5e1' }}
        title={value || '默认'}
        onClick={() => setOpen(v => !v)}
      />
      {value
        ? <span className="tc-color-label" style={{ color: value }}>{value}</span>
        : <span className="tc-color-label tc-color-default">默认</span>}
      {open && <ColorPopover value={value} onChange={onChange} onClose={() => setOpen(false)} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// Tab 1：导航链接文字颜色
// ─────────────────────────────────────────────
function LinksTab() {
  const [links, setLinks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const size = 20;

  const load = (p = page, kw = keyword, cat = category) => {
    setLoading(true);
    linksApi.getList({ page: p, size, keyword: kw, category: cat })
      .then(res => { setLinks(res.data || []); setTotal(res.total || 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    categoriesApi.getAll().then(res => setCategories(res.data || []));
    load();
  }, []);

  const handleSearch = e => { e.preventDefault(); setPage(1); load(1, keyword, category); };

  const handleCategoryChange = val => {
    setCategory(val);
    setPage(1);
    load(1, keyword, val);
  };

  const updateLocal = (id, field, value) => {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, [field]: value, _dirty: true } : l));
    setSaved(s => { const n = { ...s }; delete n[id]; return n; });
  };

  const saveRow = async link => {
    setSaving(s => ({ ...s, [link.id]: true }));
    try {
      await linksApi.update(link.id, {
        title: link.title, url: link.url, logo: link.logo || '',
        description: link.description || '', category_id: link.category_id || '',
        badge: link.badge || '', title_color: link.title_color || '', desc_color: link.desc_color || '',
      });
      setLinks(prev => prev.map(l => l.id === link.id ? { ...l, _dirty: false } : l));
      setSaved(s => ({ ...s, [link.id]: true }));
      setTimeout(() => setSaved(s => { const n = { ...s }; delete n[link.id]; return n; }), 2000);
    } catch { alert('保存失败'); }
    finally { setSaving(s => ({ ...s, [link.id]: false })); }
  };

  const saveDirty = async () => { for (const l of links.filter(l => l._dirty)) await saveRow(l); };
  const dirtyCount = links.filter(l => l._dirty).length;
  const totalPages = Math.ceil(total / size);

  return (
    <>
      <div className="tc-toolbar">
        <form className="search-bar" style={{ flex: 1 }} onSubmit={handleSearch}>
          <input className="form-input" placeholder="搜索网站名称..." value={keyword} onChange={e => setKeyword(e.target.value)} />
          <select
            className="form-input tc-cat-select"
            value={category}
            onChange={e => handleCategoryChange(e.target.value)}
          >
            <option value="">全部分类</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
          <button className="btn-secondary" type="submit">搜索</button>
          {(keyword || category) && (
            <button className="btn-ghost" type="button" onClick={() => {
              setKeyword(''); setCategory(''); setPage(1); load(1, '', '');
            }}>清空</button>
          )}
        </form>
        {dirtyCount > 0 && (
          <button className="btn-primary" onClick={saveDirty}>💾 保存全部（{dirtyCount}）</button>
        )}
      </div>
      <div className="table-meta">共 {total} 条{category ? `（已筛选）` : ''}</div>
      {loading ? <div className="admin-loading">加载中...</div> : (
        <div className="table-wrap">
          <table className="admin-table tc-table">
            <thead>
              <tr>
                <th>网站名称</th>
                <th>分类</th>
                <th><span className="tc-th-dot" style={{ background: '#3b82f6' }} /> 名称颜色</th>
                <th><span className="tc-th-dot" style={{ background: '#94a3b8' }} /> 描述颜色</th>
                <th>预览效果</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {links.map(link => (
                <tr key={link.id} className={link._dirty ? 'tc-row-dirty' : ''}>
                  <td className="tc-name-cell">
                    {link.logo
                      ? <img src={link.logo} alt="" className="tc-logo" onError={e => e.target.style.display = 'none'} />
                      : <div className="tc-logo-fallback">{link.title[0]}</div>}
                    <span>{link.title}</span>
                  </td>
                  <td>{link.category_name || '-'}</td>
                  <td><ColorCell value={link.title_color || ''} onChange={v => updateLocal(link.id, 'title_color', v)} /></td>
                  <td><ColorCell value={link.desc_color || ''} onChange={v => updateLocal(link.id, 'desc_color', v)} /></td>
                  <td>
                    <div className="tc-preview">
                      <span className="tc-preview-title" style={link.title_color ? { color: link.title_color } : {}}>{link.title}</span>
                      {link.description && (
                        <span className="tc-preview-desc" style={link.desc_color ? { color: link.desc_color } : {}}>
                          {link.description.slice(0, 18)}{link.description.length > 18 ? '…' : ''}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    {link._dirty
                      ? <button className="btn-sm btn-primary" onClick={() => saveRow(link)} disabled={saving[link.id]}>{saving[link.id] ? '保存中…' : '保存'}</button>
                      : saved[link.id]
                        ? <span className="tc-saved-badge">✓ 已保存</span>
                        : <span className="tc-no-change">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => { setPage(p => p - 1); load(page - 1); }}>上一页</button>
          <span>{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => { setPage(p => p + 1); load(page + 1); }}>下一页</button>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// Tab 2：广告栏文字颜色
// ─────────────────────────────────────────────
function AdsTab() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});

  const load = () => {
    setLoading(true);
    adsApi.getAll().then(res => setAds(res.data || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const updateLocal = (id, field, value) => {
    setAds(prev => prev.map(a => a.id === id ? { ...a, [field]: value, _dirty: true } : a));
    setSaved(s => { const n = { ...s }; delete n[id]; return n; });
  };

  const saveRow = async ad => {
    setSaving(s => ({ ...s, [ad.id]: true }));
    try {
      await adsApi.update(ad.id, {
        title: ad.title, description: ad.description || '', badge: ad.badge || '',
        badge_color: ad.badge_color || '#6366f1', link: ad.link || '',
        columns: ad.columns || 1, bg_color: ad.bg_color || '',
        sort: ad.sort ?? 0, enabled: ad.enabled ?? 1,
        title_color: ad.title_color || '', desc_color: ad.desc_color || '',
      });
      setAds(prev => prev.map(a => a.id === ad.id ? { ...a, _dirty: false } : a));
      setSaved(s => ({ ...s, [ad.id]: true }));
      setTimeout(() => setSaved(s => { const n = { ...s }; delete n[ad.id]; return n; }), 2000);
    } catch { alert('保存失败'); }
    finally { setSaving(s => ({ ...s, [ad.id]: false })); }
  };

  const saveDirty = async () => { for (const a of ads.filter(a => a._dirty)) await saveRow(a); };
  const dirtyCount = ads.filter(a => a._dirty).length;

  if (loading) return <div className="admin-loading">加载中...</div>;
  if (ads.length === 0) return (
    <div className="ads-empty">
      <div className="ads-empty-icon">📢</div>
      <p>暂无广告，请先在「广告栏」页面创建</p>
    </div>
  );

  return (
    <>
      <div className="tc-toolbar">
        <span className="table-meta" style={{ margin: 0 }}>共 {ads.length} 条广告</span>
        {dirtyCount > 0 && (
          <button className="btn-primary" onClick={saveDirty}>💾 保存全部（{dirtyCount}）</button>
        )}
      </div>
      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table className="admin-table tc-table">
          <thead>
            <tr>
              <th>广告标题</th>
              <th>宽度</th>
              <th><span className="tc-th-dot" style={{ background: '#3b82f6' }} /> 标题颜色</th>
              <th><span className="tc-th-dot" style={{ background: '#94a3b8' }} /> 描述颜色</th>
              <th>预览效果</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {ads.map(ad => (
              <tr key={ad.id} className={ad._dirty ? 'tc-row-dirty' : ''}>
                <td className="tc-name-cell">
                  <div className="tc-ad-dot" style={{ background: ad.bg_color || '#e2e8f0' }} />
                  <span>{ad.title}</span>
                  {!ad.enabled && <span className="ads-admin-off" style={{ marginLeft: 6 }}>禁用</span>}
                </td>
                <td>
                  <span className="ads-admin-cols">{ad.columns === 2 ? '全宽' : '半宽'}</span>
                </td>
                <td><ColorCell value={ad.title_color || ''} onChange={v => updateLocal(ad.id, 'title_color', v)} /></td>
                <td><ColorCell value={ad.desc_color || ''} onChange={v => updateLocal(ad.id, 'desc_color', v)} /></td>
                <td>
                  <div className="tc-preview" style={{ background: ad.bg_color || 'transparent', borderRadius: 6, padding: '4px 8px' }}>
                    <span className="tc-preview-title" style={ad.title_color ? { color: ad.title_color } : {}}>{ad.title}</span>
                    {ad.description && (
                      <span className="tc-preview-desc" style={ad.desc_color ? { color: ad.desc_color } : {}}>
                        {ad.description.slice(0, 20)}{ad.description.length > 20 ? '…' : ''}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  {ad._dirty
                    ? <button className="btn-sm btn-primary" onClick={() => saveRow(ad)} disabled={saving[ad.id]}>{saving[ad.id] ? '保存中…' : '保存'}</button>
                    : saved[ad.id]
                      ? <span className="tc-saved-badge">✓ 已保存</span>
                      : <span className="tc-no-change">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// 主页面：带 Tab 切换
// ─────────────────────────────────────────────
export default function TextColors() {
  const [tab, setTab] = useState('links');

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">文字管理</h1>
          <p className="admin-page-sub">点击色块更换颜色，修改后点击「保存」生效</p>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="tc-tabs">
        <button className={`tc-tab ${tab === 'links' ? 'active' : ''}`} onClick={() => setTab('links')}>
          🔗 导航链接
        </button>
        <button className={`tc-tab ${tab === 'ads' ? 'active' : ''}`} onClick={() => setTab('ads')}>
          📢 广告栏
        </button>
      </div>

      {tab === 'links' ? <LinksTab /> : <AdsTab />}
    </div>
  );
}
