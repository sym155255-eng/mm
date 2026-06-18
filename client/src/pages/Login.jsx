import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register, fetchCaptcha } from '../api';
import { useAuth } from '../store/auth';

export default function Login() {
  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ username: '', password: '', nickname: '' });
  const [captchaText, setCaptchaText] = useState('');
  const [captcha, setCaptcha] = useState({ token: '', svg: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signIn } = useAuth();
  const nav = useNavigate();

  function loadCaptcha() { fetchCaptcha().then(d => { setCaptcha(d); setCaptchaText(''); }); }
  useEffect(() => { loadCaptcha(); }, []);

  // 已登录则按角色跳转
  useEffect(() => {
    if (localStorage.getItem('nav_token')) {
      nav(user?.role === 'admin' ? '/admin' : '/', { replace: true });
    }
  }, [nav, user]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!captchaText.trim()) { setError('请输入图形验证码'); return; }
    setLoading(true);
    setError('');
    const res = mode === 'login'
      ? await login(form.username, form.password, captcha.token, captchaText)
      : await register(form.username, form.password, form.nickname, captcha.token, captchaText);
    setLoading(false);
    if (res.token) {
      signIn(res.token, res.user);
      nav(res.user.role === 'admin' ? '/admin' : '/');
    } else {
      setError(res.error || (mode === 'login' ? '登录失败' : '注册失败'));
      loadCaptcha();
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>🧭</div>
        <h1 style={s.title}>{mode === 'login' ? '登录' : '注册'}</h1>
        <p style={s.sub}>导航站 · 登录后可发表评论</p>

        {/* 切换 */}
        <div style={s.tabs}>
          <button type="button" style={{ ...s.tab, ...(mode === 'login' ? s.tabActive : {}) }} onClick={() => { setMode('login'); setError(''); }}>登录</button>
          <button type="button" style={{ ...s.tab, ...(mode === 'register' ? s.tabActive : {}) }} onClick={() => { setMode('register'); setError(''); }}>注册</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={s.field}>
            <label style={s.label}>用户名</label>
            <input style={s.input} value={form.username} onChange={e => set('username', e.target.value)} placeholder="2-20 位" required />
          </div>
          {mode === 'register' && (
            <div style={s.field}>
              <label style={s.label}>昵称 <span style={{ color: '#9ca3af', fontWeight: 400 }}>(可选)</span></label>
              <input style={s.input} value={form.nickname} onChange={e => set('nickname', e.target.value)} placeholder="评论时显示，留空用用户名" />
            </div>
          )}
          <div style={s.field}>
            <label style={s.label}>密码</label>
            <input style={s.input} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder={mode === 'register' ? '至少 6 位' : ''} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>图形验证码</label>
            <div style={s.captchaRow}>
              <input style={{ ...s.input, flex: 1 }} value={captchaText} onChange={e => setCaptchaText(e.target.value)} placeholder="输入图中字符" required />
              {captcha.svg && <img src={captcha.svg} alt="验证码" title="点击刷新" onClick={loadCaptcha} style={s.captchaImg} />}
            </div>
          </div>
          {error && <div style={s.error}>{error}</div>}
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? '处理中...' : (mode === 'login' ? '登录' : '注册并登录')}
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
  sub: { color: '#6b7280', fontSize: 14, marginBottom: 20 },
  tabs: { display: 'flex', gap: 6, background: '#f3f4f6', borderRadius: 10, padding: 4, marginBottom: 20 },
  tab: { flex: 1, padding: '8px 0', border: 'none', background: 'transparent', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#6b7280', cursor: 'pointer' },
  tabActive: { background: '#fff', color: 'var(--primary)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  field: { textAlign: 'left', marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' },
  input: { width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, transition: 'border-color 0.2s' },
  captchaRow: { display: 'flex', alignItems: 'center', gap: 10 },
  captchaImg: { height: 42, borderRadius: 8, cursor: 'pointer', border: '1px solid #e5e7eb', flexShrink: 0 },
  error: { background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12, textAlign: 'left' },
  btn: { width: '100%', padding: '11px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
  back: { display: 'block', marginTop: 20, color: '#6b7280', fontSize: 13 },
};
