import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

export default function Me() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();

  useEffect(() => { if (!user) nav('/login', { replace: true }); }, [user, nav]);
  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const display = isAdmin ? '管理员' : (user.nickname || user.username);

  function logout() { signOut(); nav('/'); }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.headerInner}>
          <Link to="/" style={s.logo}>🧭 <span style={{ fontWeight: 700 }}>我的</span></Link>
          <Link to="/" style={s.back}>← 返回</Link>
        </div>
      </header>

      <div style={s.body}>
        <div style={s.card}>
          <div style={s.avatar}>{display[0]}</div>
          <div style={s.name}>{display}</div>
          <div style={s.role}>{isAdmin ? '管理员' : '注册用户'}</div>

          <div style={s.infoRow}><span style={s.infoLabel}>用户名</span><span>{user.username}</span></div>
          {user.nickname && <div style={s.infoRow}><span style={s.infoLabel}>昵称</span><span>{user.nickname}</span></div>}

          {isAdmin && <Link to="/admin" style={s.adminBtn}>进入管理后台 →</Link>}
          <button onClick={logout} style={s.logoutBtn}>退出登录</button>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg)' },
  header: { background: '#fff', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10 },
  headerInner: { maxWidth: 600, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'var(--text)' },
  back: { background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '6px 14px', fontSize: 14, fontWeight: 600, color: '#374151', textDecoration: 'none' },
  body: { maxWidth: 600, margin: '0 auto', padding: '20px 16px 80px' },
  card: { background: '#fff', borderRadius: 14, padding: '28px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', textAlign: 'center' },
  avatar: { width: 64, height: 64, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: 28, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', textTransform: 'uppercase' },
  name: { fontSize: 20, fontWeight: 700, color: 'var(--text)' },
  role: { fontSize: 13, color: '#9ca3af', marginTop: 4, marginBottom: 20 },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '12px 4px', borderTop: '1px solid #f3f4f6', fontSize: 14, color: '#374151' },
  infoLabel: { color: '#9ca3af' },
  adminBtn: { display: 'block', marginTop: 22, background: '#eff2ff', color: 'var(--primary)', padding: '11px', borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none' },
  logoutBtn: { width: '100%', marginTop: 10, background: '#fef2f2', color: '#dc2626', border: 'none', padding: '12px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
};
