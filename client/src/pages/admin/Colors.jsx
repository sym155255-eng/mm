import React, { useEffect, useState } from 'react';
import { getSettings, saveSettings, getLinks, getCategories, updateLink, getAds, updateAd } from '../../api';

const GLOBAL_GROUPS = [
  {
    title: '🎨 主题 & 页面',
    keys: [
      { key: 'bg_color',            label: '页面背景',    default: '#f0f4ff' },
      { key: 'primary_color',       label: '主题色',      default: '#4f6ef7' },
      { key: 'color_header_bg',     label: '顶部栏背景',  default: '#ffffff' },
      { key: 'color_site_title',    label: '站点标题',    default: '#1a1a2e' },
      { key: 'color_footer',        label: '页脚文字',    default: '#6b7280' },
    ],
  },
  {
    title: '🧭 导航栏',
    keys: [
      { key: 'color_nav_bg',     label: '导航栏背景',  default: '#ffffff' },
      { key: 'color_nav_item_bg',label: '导航项背景',  default: '#f3f4f6' },
      { key: 'color_nav_text',   label: '导航文字',    default: '#374151' },
    ],
  },
  {
    title: '📦 分类容器',
    keys: [
      { key: 'color_section_bg',    label: '分类容器背景',default: '#ffffff' },
      { key: 'color_section_title', label: '分类标题',    default: '#1a1a2e' },
      { key: 'color_tab_bg',        label: '标签页背景',  default: '#f3f4f6' },
      { key: 'color_tab_text',      label: '标签页文字',  default: '#374151' },
    ],
  },
  {
    title: '🔗 链接卡片',
    keys: [
      { key: 'color_card_title',    label: '卡片标题',    default: '#1a1a2e' },
      { key: 'color_card_desc',     label: '卡片描述',    default: '#6b7280' },
      { key: 'color_card_bg',       label: '卡片背景',    default: '#f7f8fa' },
      { key: 'color_card_border',   label: '卡片边框',    default: '#f0f1f3' },
      { key: 'color_card_hover',    label: '卡片悬停背景',default: '#ffffff' },
      { key: 'color_icon_bg',       label: '图标底色',    default: '#ffffff' },
    ],
  },
  {
    title: '📢 广告卡片',
    keys: [
      { key: 'color_ad_title',      label: '广告标题',    default: '#1a1a2e' },
      { key: 'color_ad_desc',       label: '广告描述',    default: '#6b7280' },
      { key: 'color_ad_bg',         label: '广告背景',    default: '#ffffff' },
      { key: 'color_ad_border',     label: '广告边框',    default: '#fbbf24' },
      { key: 'color_badge',         label: '默认角标色',  default: '#ef4444' },
    ],
  },
];
const GLOBAL_KEYS = GLOBAL_GROUPS.flatMap(g => g.keys);

export default function Colors() {
  const [global, setGlobal] = useState({});
  const [globalSaved, setGlobalSaved] = useState(false);
  const [links, setLinks] = useState([]);
  const [cats, setCats] = useState([]);
  const [ads, setAds] = useState([]);
  const [filterCat, setFilterCat] = useState('');

  useEffect(() => {
    getSettings().then(s => {
      const init = {};
      GLOBAL_KEYS.forEach(({ key, default: def }) => { init[key] = s[key] || def; });
      setGlobal(init);
    });
    Promise.all([getLinks(), getCategories(), getAds()]).then(([l, c, a]) => {
      setLinks(l); setCats(c); setAds(a);
    });
  }, []);

  async function saveGlobal(e) {
    e.preventDefault();
    await saveSettings(global);
    setGlobalSaved(true);
    setTimeout(() => setGlobalSaved(false), 2000);
  }

  async function resetGlobal() {
    const init = {};
    GLOBAL_KEYS.forEach(({ key, default: def }) => { init[key] = def; });
    setGlobal(init);
    await saveSettings(init);
    setGlobalSaved(true);
    setTimeout(() => setGlobalSaved(false), 2000);
  }

  const catName = id => cats.find(c => c.id === id)?.name || '未分类';
  const filtered = filterCat ? links.filter(l => l.category_id === parseInt(filterCat)) : links;

  return (
    <div style={{ maxWidth: 860 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>颜色管理</h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>
        全局颜色作为默认值，单独设置某条目的颜色后以该颜色优先。
      </p>

      {/* 全局颜色 */}
      <form onSubmit={saveGlobal}>
        <div style={s.sectionHdr}><span style={s.sectionLabel}>🌐 全局默认颜色</span></div>
        {GLOBAL_GROUPS.map(group => (
          <div key={group.title} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>{group.title}</div>
            <div style={s.card}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 0 }}>
                {group.keys.map(({ key, label }) => (
                  <div key={key} style={s.globalRow}>
                    <span style={s.globalLabel}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="color" value={global[key] || '#ffffff'}
                        onChange={e => setGlobal(g => ({ ...g, [key]: e.target.value }))} style={s.colorPicker} />
                      <input type="text" value={global[key] || ''}
                        onChange={e => setGlobal(g => ({ ...g, [key]: e.target.value }))} style={s.hexInput} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 32 }}>
          <button type="submit" style={s.saveBtn}>保存全局颜色</button>
          <button type="button" onClick={resetGlobal} style={s.resetBtn}>恢复默认</button>
          {globalSaved && <span style={{ color: '#16a34a', fontSize: 14, fontWeight: 600 }}>✅ 已保存</span>}
        </div>
      </form>

      {/* 链接颜色 */}
      <div style={s.sectionHdr}>
        <span style={s.sectionLabel}>🔗 链接卡片颜色</span>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={s.filterSelect}>
          <option value="">全部分类</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>
      <ColorTable
        rows={filtered}
        subLabel={r => catName(r.category_id)}
        onUpdate={(id, patch) => setLinks(ls => ls.map(l => l.id === id ? { ...l, ...patch } : l))}
        onSave={row => updateLink(row.id, row)}
        onClear={row => { const u = { ...row, title_color: '', desc_color: '', badge_color: '' }; setLinks(ls => ls.map(l => l.id === row.id ? u : l)); return updateLink(row.id, u); }}
      />

      {/* 广告颜色 */}
      <div style={{ ...s.sectionHdr, marginTop: 28 }}>
        <span style={s.sectionLabel}>📢 广告/公告颜色</span>
      </div>
      <ColorTable
        rows={ads}
        subLabel={r => r.description || '—'}
        onUpdate={(id, patch) => setAds(as => as.map(a => a.id === id ? { ...a, ...patch } : a))}
        onSave={row => updateAd(row.id, row)}
        onClear={row => { const u = { ...row, title_color: '', desc_color: '', badge_color: '' }; setAds(as => as.map(a => a.id === row.id ? u : a)); return updateAd(row.id, u); }}
      />
    </div>
  );
}

function ColorRow({ row, subLabel, onUpdate, onSave, onClear }) {
  const [status, setStatus] = useState('');

  async function handleSave() {
    setStatus('saving');
    try {
      const res = await onSave(row);
      if (res && res.ok) { setStatus('ok'); setTimeout(() => setStatus(''), 1500); }
      else { setStatus('err'); setTimeout(() => setStatus(''), 2000); }
    } catch { setStatus('err'); setTimeout(() => setStatus(''), 2000); }
  }

  async function handleClear() {
    setStatus('saving');
    try {
      await onClear(row);
      setStatus('ok'); setTimeout(() => setStatus(''), 1500);
    } catch { setStatus('err'); setTimeout(() => setStatus(''), 2000); }
  }

  const hasAny = (row.title_color || row.desc_color || row.badge_color || '').trim();

  return (
    <div style={s.linkRow}>
      <span style={{ width: 110, fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.title}</span>
      <span style={{ width: 64, color: '#6b7280', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subLabel(row)}</span>
      <span style={{ width: 148 }}>
        <ColorInput value={row.title_color || ''} placeholder="跟随全局" onChange={v => onUpdate(row.id, { title_color: v })} />
      </span>
      <span style={{ width: 148 }}>
        <ColorInput value={row.desc_color || ''} placeholder="跟随全局" onChange={v => onUpdate(row.id, { desc_color: v })} />
      </span>
      <span style={{ width: 148 }}>
        <ColorInput value={row.badge_color || ''} placeholder="角标背景色" onChange={v => onUpdate(row.id, { badge_color: v })} />
      </span>
      {row.badge ? (
        <span style={{ width: 44, display: 'flex', justifyContent: 'center' }}>
          <span style={{
            background: row.badge_color || '#ef4444',
            color: '#fff', fontSize: 10, fontWeight: 700,
            padding: '2px 5px', borderRadius: 4, whiteSpace: 'nowrap'
          }}>{row.badge}</span>
        </span>
      ) : (
        <span style={{ width: 44, color: '#d1d5db', fontSize: 11, textAlign: 'center' }}>无</span>
      )}
      <span style={{ width: 88, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
        {status === 'ok'  && <span style={{ fontSize: 13 }}>✅</span>}
        {status === 'err' && <span style={{ fontSize: 11, color: '#dc2626' }}>失败</span>}
        <button onClick={handleSave} disabled={status === 'saving'}
          style={{ ...s.applyBtn, opacity: status === 'saving' ? 0.5 : 1 }}>
          {status === 'saving' ? '…' : '保存'}
        </button>
        {hasAny && <button onClick={handleClear} style={s.clearBtn} title="清除">✕</button>}
      </span>
    </div>
  );
}

function ColorTable({ rows, subLabel, onUpdate, onSave, onClear }) {
  return (
    <div className="color-table" style={s.linkTable}>
      <div style={s.thead}>
        <span style={{ width: 110 }}>名称</span>
        <span style={{ width: 64 }}>说明</span>
        <span style={{ width: 148 }}>标题颜色</span>
        <span style={{ width: 148 }}>描述颜色</span>
        <span style={{ width: 148 }}>角标颜色</span>
        <span style={{ width: 44, textAlign: 'center' }}>预览</span>
        <span style={{ width: 88, textAlign: 'right' }}>操作</span>
      </div>
      {rows.map(row => (
        <ColorRow key={row.id} row={row} subLabel={subLabel} onUpdate={onUpdate} onSave={onSave} onClear={onClear} />
      ))}
      {rows.length === 0 && <div style={s.empty}>暂无数据</div>}
    </div>
  );
}

function ColorInput({ value, placeholder, onChange }) {
  const hasVal = value && value.trim();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <input type="color" value={hasVal ? value : '#888888'} onChange={e => onChange(e.target.value)}
        style={{ width: 26, height: 24, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 1, flexShrink: 0 }} />
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: 82, padding: '5px 6px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 11, fontFamily: 'monospace', color: hasVal ? value : '#9ca3af' }} />
    </div>
  );
}

const s = {
  sectionHdr: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionLabel: { fontSize: 15, fontWeight: 700, color: '#1a1a2e' },
  filterSelect: { padding: '6px 10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13 },
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 16 },
  globalRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f3f4f6' },
  globalLabel: { fontSize: 13, fontWeight: 500, color: '#374151' },
  colorPicker: { width: 30, height: 26, border: 'none', borderRadius: 5, cursor: 'pointer', padding: 1 },
  hexInput: { width: 82, padding: '5px 8px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 12, fontFamily: 'monospace' },
  saveBtn: { background: 'var(--primary)', color: '#fff', padding: '9px 22px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' },
  resetBtn: { padding: '9px 18px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 13, cursor: 'pointer', color: '#6b7280' },
  linkTable: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 8 },
  thead: { display: 'flex', alignItems: 'center', padding: '10px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280', fontWeight: 600, gap: 8 },
  linkRow: { display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #f3f4f6', gap: 8 },
  applyBtn: { background: '#eff2ff', color: 'var(--primary)', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' },
  clearBtn: { background: '#fef2f2', color: '#dc2626', padding: '4px 8px', borderRadius: 6, fontSize: 12, border: 'none', cursor: 'pointer' },
  empty: { padding: '32px', textAlign: 'center', color: '#9ca3af' },
};
