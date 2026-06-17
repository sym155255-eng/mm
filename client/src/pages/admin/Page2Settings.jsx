import React, { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../../api';

export default function Page2Settings() {
  const [bg, setBg] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => { getSettings().then(s => setBg(s?.p2_bg || '')); }, []);

  async function handleSave() {
    await saveSettings({ p2_bg: bg });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>第二页设置</h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>自定义第二页（/home2）的背景，留空则用默认深色渐变。</p>

      <div style={s.card}>
        <div style={s.row}>
          <span style={s.label}>背景颜色</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(bg) ? bg : '#0f172a'} onChange={e => setBg(e.target.value)}
              style={{ width: 40, height: 34, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
            <input value={bg} onChange={e => setBg(e.target.value)} placeholder="留空用默认；可填 #0f172a 或 linear-gradient(...)"
              style={s.input} />
            {bg && <button onClick={() => setBg('')} style={s.resetBtn}>恢复默认</button>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {[
            ['深色渐变(默认)', 'linear-gradient(180deg,#0f172a,#1e293b)'],
            ['纯黑', '#0b1220'],
            ['深蓝', '#0f2747'],
            ['墨绿', '#0f2e25'],
            ['深紫', '#241b3a'],
            ['浅灰', '#f0f4ff'],
          ].map(([name, val]) => (
            <button key={name} onClick={() => setBg(val)} style={{ ...s.preset, background: val, color: val.includes('f0f4ff') ? '#333' : '#fff' }}>{name}</button>
          ))}
        </div>
      </div>

      {/* 预览 */}
      <div style={{ marginTop: 16, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
        <div style={{ height: 120, background: bg || 'linear-gradient(180deg,#0f172a,#1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13 }}>预览效果</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
        <button style={s.saveBtn} onClick={handleSave}>保存</button>
        {saved && <span style={{ color: '#16a34a', fontSize: 14, fontWeight: 600 }}>✅ 已保存</span>}
        <a href="/home2" target="_blank" style={{ marginLeft: 'auto', color: 'var(--primary)', fontSize: 13, textDecoration: 'none' }}>查看第二页 ↗</a>
      </div>
    </div>
  );
}

const s = {
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '16px 20px' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  label: { fontSize: 14, fontWeight: 600, color: '#374151', flexShrink: 0 },
  input: { width: 280, padding: '8px 10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13 },
  resetBtn: { background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 6, padding: '7px 10px', fontSize: 12, cursor: 'pointer', flexShrink: 0 },
  preset: { border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 },
  saveBtn: { background: 'var(--primary)', color: '#fff', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' },
};
