import React, { useEffect, useState } from 'react';
import { getSettings, saveSettings, changePassword } from '../../api';

export default function Settings() {
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    getSettings().then(s => setForm(s));
  }, []);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSave(e) {
    e.preventDefault();
    await saveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handlePw(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { setPwMsg('两次密码不一致'); return; }
    const res = await changePassword(pwForm.oldPassword, pwForm.newPassword);
    if (res.ok) { setPwMsg('✅ 修改成功'); setPwForm({ oldPassword: '', newPassword: '', confirm: '' }); }
    else setPwMsg(res.error || '修改失败');
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>网站设置</h2>

      <form onSubmit={handleSave}>
        <Card title="基本信息">
          <Field label="网站名称" value={form.site_title || ''} onChange={v => set('site_title', v)} />
          <Field label="副标题" value={form.site_subtitle || ''} onChange={v => set('site_subtitle', v)} />
          <Field label="网站图标 (emoji)" value={form.site_logo || ''} onChange={v => set('site_logo', v)} placeholder="🧭" />
          <Field label="页脚文字" value={form.footer_text || ''} onChange={v => set('footer_text', v)} />
          <Field label="搜索框占位符" value={form.search_placeholder || ''} onChange={v => set('search_placeholder', v)} />
        </Card>

        <Card title="外观">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <ColorField label="主题色" value={form.primary_color || '#4f6ef7'} onChange={v => set('primary_color', v)} />
            <ColorField label="背景色" value={form.bg_color || '#f0f4ff'} onChange={v => set('bg_color', v)} />
          </div>
        </Card>

        <Card title="功能开关">
          <Toggle label="显示搜索框" value={form.show_search !== '0'} onChange={v => set('show_search', v ? '1' : '0')} />
          <Toggle label="显示广告/公告栏" value={form.show_ads !== '0'} onChange={v => set('show_ads', v ? '1' : '0')} />
        </Card>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="submit" style={s.saveBtn}>保存设置</button>
          {saved && <span style={{ color: '#16a34a', fontSize: 14, fontWeight: 600 }}>✅ 已保存</span>}
        </div>
      </form>

      <div style={{ marginTop: 36 }}>
        <Card title="修改密码">
          <form onSubmit={handlePw}>
            <Field label="原密码" value={pwForm.oldPassword} onChange={v => setPwForm(f => ({ ...f, oldPassword: v }))} type="password" />
            <Field label="新密码" value={pwForm.newPassword} onChange={v => setPwForm(f => ({ ...f, newPassword: v }))} type="password" />
            <Field label="确认新密码" value={pwForm.confirm} onChange={v => setPwForm(f => ({ ...f, confirm: v }))} type="password" />
            {pwMsg && <div style={{ fontSize: 13, color: pwMsg.startsWith('✅') ? '#16a34a' : '#dc2626', marginBottom: 12 }}>{pwMsg}</div>}
            <button type="submit" style={s.saveBtn}>修改密码</button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '20px 24px', marginBottom: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#374151' }}>{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14 }} />
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14 }} />
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}>
      <span style={{ fontSize: 14 }}>{label}</span>
      <div onClick={() => onChange(!value)} style={{
        width: 44, height: 24, borderRadius: 12, background: value ? 'var(--primary)' : '#d1d5db',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 3, left: value ? 23 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }} />
      </div>
    </label>
  );
}

const s = {
  saveBtn: { background: 'var(--primary)', color: '#fff', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' },
};
