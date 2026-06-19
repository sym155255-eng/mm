import React, { useEffect, useState } from 'react';
import { getLinks, getCategories, getAds, setLinkDescGradient, setAdDescGradient } from '../../api';

// 解析 "linear-gradient(90deg, c1, c2[, c3])" → { angle, colors[] }
function parseGrad(g) {
  const m = /linear-gradient\(\s*(\d+)deg\s*,\s*(.+)\)\s*$/i.exec(g || '');
  if (m) {
    const colors = m[2].split(',').map(s => s.trim()).filter(Boolean);
    return { angle: parseInt(m[1]), colors };
  }
  return { angle: 90, colors: ['#f97316', '#ef4444', '#a855f7'] };
}
function buildGrad({ angle, colors }) { return `linear-gradient(${angle}deg, ${colors.filter(Boolean).join(', ')})`; }

export default function Gradients() {
  const [tab, setTab] = useState('links');
  const [links, setLinks] = useState([]);
  const [cats, setCats] = useState([]);
  const [ads, setAds] = useState([]);
  const [filterCat, setFilterCat] = useState('');

  useEffect(() => {
    Promise.all([getLinks(), getCategories(), getAds()]).then(([l, c, a]) => { setLinks(l); setCats(c); setAds(a); });
  }, []);

  const catName = id => cats.find(c => c.id === id)?.name || '未分类';

  return (
    <div style={{ maxWidth: 720 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>颜色渐变</h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 18 }}>给「卡片描述 / 广告描述」设置渐变文字。留空则用普通颜色。</p>

      <div className="grad-head" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="grad-tabs" style={s.tabs}>
          <button className="grad-tab" style={{ ...s.tab, ...(tab === 'links' ? s.tabActive : {}) }} onClick={() => setTab('links')}>卡片描述 ({links.length})</button>
          <button className="grad-tab" style={{ ...s.tab, ...(tab === 'ads' ? s.tabActive : {}) }} onClick={() => setTab('ads')}>广告描述 ({ads.length})</button>
        </div>
        {tab === 'links' && (
          <select className="grad-filter" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={s.filterSelect}>
            <option value="">全部分类</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        )}
      </div>

      <div style={s.card}>
        {(tab === 'links' ? (filterCat ? links.filter(l => l.category_id === parseInt(filterCat)) : links) : ads).map(row => (
          <GradRow
            key={row.id}
            row={row}
            sub={tab === 'links' ? catName(row.category_id) : (row.position || 'top')}
            onSave={(id, g) => (tab === 'links' ? setLinkDescGradient(id, g) : setAdDescGradient(id, g))}
            onLocal={(id, g) => (tab === 'links'
              ? setLinks(ls => ls.map(x => x.id === id ? { ...x, desc_gradient: g } : x))
              : setAds(as => as.map(x => x.id === id ? { ...x, desc_gradient: g } : x)))}
          />
        ))}
        {(tab === 'links' ? links : ads).length === 0 && <div style={s.empty}>暂无数据</div>}
      </div>
    </div>
  );
}

function GradRow({ row, sub, onSave, onLocal }) {
  const has = !!(row.desc_gradient && row.desc_gradient.trim());
  const g = parseGrad(row.desc_gradient);
  const [status, setStatus] = useState('');

  // 固定 3 个色槽（不足则补默认）
  const cols = [g.colors[0] || '#f97316', g.colors[1] || '#ef4444', g.colors[2] || '#a855f7'];
  function setColor(i, val) {
    const next = [...cols]; next[i] = val;
    onLocal(row.id, buildGrad({ angle: g.angle, colors: next }));
  }
  function setAngle(a) { onLocal(row.id, buildGrad({ angle: a, colors: cols })); }
  async function save() {
    setStatus('saving');
    try { const r = await onSave(row.id, row.desc_gradient || ''); setStatus(r && r.ok ? 'ok' : 'err'); }
    catch { setStatus('err'); }
    setTimeout(() => setStatus(''), 1500);
  }
  function clear() { onLocal(row.id, ''); onSave(row.id, ''); }

  const previewText = row.description || row.title || '示例描述文字';
  const gradStyle = has
    ? { backgroundImage: row.desc_gradient, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent', fontWeight: 700, animation: 'gradFlow 3s linear infinite' }
    : { color: '#9ca3af' };

  return (
    <div style={s.row}>
      <div style={{ width: 150, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.title}</div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>{sub}</div>
        <div style={{ ...gradStyle, fontSize: 12, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{previewText}</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
        <input type="color" value={cols[0]} onChange={e => setColor(0, e.target.value)} style={s.color} title="颜色1" />
        <input type="color" value={cols[1]} onChange={e => setColor(1, e.target.value)} style={s.color} title="颜色2" />
        <input type="color" value={cols[2]} onChange={e => setColor(2, e.target.value)} style={s.color} title="颜色3" />
        <select value={g.angle} onChange={e => setAngle(parseInt(e.target.value))} style={s.sel}>
          <option value={90}>→</option><option value={0}>↑</option><option value={45}>↗</option><option value={135}>↘</option>
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {status === 'ok' && <span style={{ fontSize: 13 }}>✅</span>}
        {status === 'err' && <span style={{ fontSize: 11, color: '#dc2626' }}>失败</span>}
        <button onClick={save} disabled={status === 'saving'} style={s.saveBtn}>{status === 'saving' ? '…' : '保存'}</button>
        {has && <button onClick={clear} style={s.clearBtn} title="清除">✕</button>}
      </div>
    </div>
  );
}

const s = {
  tabs: { display: 'flex', gap: 6 },
  filterSelect: { padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginLeft: 'auto' },
  tab: { padding: '8px 18px', border: '1.5px solid #e5e7eb', background: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#6b7280', cursor: 'pointer' },
  tabActive: { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' },
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #f3f4f6' },
  color: { width: 30, height: 26, border: 'none', borderRadius: 5, cursor: 'pointer', padding: 1 },
  sel: { padding: '4px 6px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, cursor: 'pointer' },
  saveBtn: { background: '#eff2ff', color: 'var(--primary)', padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' },
  clearBtn: { background: '#fef2f2', color: '#dc2626', padding: '5px 8px', borderRadius: 6, fontSize: 12, border: 'none', cursor: 'pointer' },
  empty: { padding: '28px', textAlign: 'center', color: '#9ca3af' },
};
