import React, { useEffect, useState } from 'react';
import { getSettings, saveSettings, uploadIcon } from '../../api';

export default function PopupNotice() {
  const [form, setForm] = useState({ popup_enabled: '0', popup_title: '', popup_content: '', popup_image: '' });
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getSettings().then(s => setForm({
      popup_enabled: s.popup_enabled === '1' ? '1' : '0',
      popup_title: s.popup_title || '',
      popup_content: s.popup_content || '',
      popup_image: s.popup_image || '',
    }));
  }, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function onPickImage(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const r = await uploadIcon(file);
      if (r.path) set('popup_image', r.path);
    } finally { setUploading(false); e.target.value = ''; }
  }

  async function handleSave() {
    await saveSettings(form);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>弹窗公告</h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>开启后，访客打开首页会弹出公告（每位访客可「今日不再提示」）。</p>

      <div style={s.card}>
        <label style={s.switchRow}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>启用弹窗公告</span>
          <input type="checkbox" checked={form.popup_enabled === '1'} onChange={e => set('popup_enabled', e.target.checked ? '1' : '0')} style={{ width: 18, height: 18 }} />
        </label>

        <label style={s.label}>标题</label>
        <input style={s.input} value={form.popup_title} onChange={e => set('popup_title', e.target.value)} placeholder="例如：公告 / 活动通知" />

        <label style={s.label}>内容</label>
        <textarea style={{ ...s.input, minHeight: 120, resize: 'vertical' }} value={form.popup_content} onChange={e => set('popup_content', e.target.value)} placeholder="支持换行" />

        <label style={s.label}>图片（可选）</label>
        {form.popup_image
          ? <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
              <img src={form.popup_image} alt="" style={{ maxWidth: 200, maxHeight: 140, borderRadius: 8, border: '1px solid #e5e7eb', display: 'block' }} />
              <button onClick={() => set('popup_image', '')} style={s.imgDel} title="移除">✕</button>
            </div>
          : <div><label style={s.uploadBtn}>{uploading ? '上传中…' : '上传图片'}<input type="file" accept="image/*" onChange={onPickImage} style={{ display: 'none' }} /></label></div>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
        <button style={s.saveBtn} onClick={handleSave}>保存</button>
        {saved && <span style={{ color: '#16a34a', fontSize: 14, fontWeight: 600 }}>✅ 已保存</span>}
        <a href="/" target="_blank" style={{ marginLeft: 'auto', color: 'var(--primary)', fontSize: 13, textDecoration: 'none' }}>查看首页 ↗</a>
      </div>
    </div>
  );
}

const s = {
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '20px 22px' },
  switchRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, marginBottom: 4, borderBottom: '1px solid #f3f4f6', cursor: 'pointer' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', margin: '14px 0 6px' },
  input: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  uploadBtn: { display: 'inline-block', background: '#f3f4f6', color: '#374151', padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  imgDel: { position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: '#111827', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer' },
  saveBtn: { background: 'var(--primary)', color: '#fff', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' },
};
