import React, { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../../api';

const FIELDS = [
  { key: 'p2_title_color',   label: '标题颜色',     def: '#222222' },
  { key: 'p2_badge_color',   label: '红色数字角标', def: '#e64340' },
  { key: 'p2_threads_color', label: '主题数颜色',   def: '#8a90a2' },
  { key: 'p2_posts_color',   label: '帖数颜色',     def: '#8a90a2' },
  { key: 'p2_lastpost_color',label: '最后发表颜色', def: '#8a90a2' },
];

export default function P2Colors() {
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => { getSettings().then(s => setForm(s || {})); }, []);
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    await saveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }
  function reset(k, def) { set(k, ''); }

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>颜色管理 · 第二页</h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>自定义第二页（论坛样式）各处文字颜色，留空则用默认。</p>

      <div style={s.card}>
        {FIELDS.map(f => (
          <div key={f.key} style={s.row}>
            <span style={s.label}>{f.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="color" value={form[f.key] || f.def} onChange={e => set(f.key, e.target.value)}
                style={{ width: 38, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
              <input value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} placeholder={`留空用默认 ${f.def}`}
                style={s.input} />
              {form[f.key] && <button onClick={() => reset(f.key, f.def)} style={s.resetBtn}>恢复默认</button>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
        <button style={s.saveBtn} onClick={handleSave}>保存</button>
        {saved && <span style={{ color: '#16a34a', fontSize: 14, fontWeight: 600 }}>✅ 已保存</span>}
      </div>
    </div>
  );
}

const s = {
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '8px 20px' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: '1px solid #f3f4f6' },
  label: { fontSize: 14, fontWeight: 600, color: '#374151', flexShrink: 0 },
  input: { width: 130, padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13 },
  resetBtn: { background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer', flexShrink: 0 },
  saveBtn: { background: 'var(--primary)', color: '#fff', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' },
};
