import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';
import { useAuth } from '../store/auth';

export default function Login() {
  const [form, setForm] = useState({ username: 'admin', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const nav = useNavigate();

  // 已登录则直接进后台，无需重复登录
  useEffect(() => {
    if (localStorage.getItem('nav_token')) nav('/admin', { replace: true });
  }, [nav]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await login(form.username, form.password);
    setLoading(false);
    if (res.token) {
      signIn(res.token, res.user);
      nav('/admin');
    } else {
      setError(res.error || '登录失败');
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>🧭</div>
        <h1 style={s.title}>管理后台</h1>
        <p style={s.sub}>导航站管理系统</p>
        <form onSubmit={handleSubmit}>
          <div style={s.field}>
            <label style={s.label}>用户名</label>
            <input style={s.input} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>密码</label>
            <input style={s.input} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="默认: admin123" required />
          </div>
          {error && <div style={s.error}>{error}</div>}
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <a href="/" style={s.back}>← 返回首页</a>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' },
  card: { background: '#fff', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 380, boxShadow: '0 4px 32px rgba(0,0,0,0.1)', textAlign: 'center' },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  sub: { color: '#6b7280', fontSize: 14, marginBottom: 28 },
  field: { textAlign: 'left', marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' },
  input: { width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, transition: 'border-color 0.2s' },
  error: { background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12, textAlign: 'left' },
  btn: { width: '100%', padding: '11px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
  back: { display: 'block', marginTop: 20, color: '#6b7280', fontSize: 13 },
};
