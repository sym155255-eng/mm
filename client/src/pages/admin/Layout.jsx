import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth';

const navItems = [
  { to: '/admin/links', icon: '🔗', label: '链接管理' },
  { to: '/admin/categories', icon: '📂', label: '分类管理' },
  { to: '/admin/sub-categories', icon: '🏷️', label: '子分类管理' },
  { to: '/admin/ads', icon: '📢', label: '广告管理' },
  { to: '/admin/notices', icon: '📣', label: '跑马灯管理' },
  { to: '/admin/colors', icon: '🎨', label: '颜色管理' },
  { to: '/admin/settings', icon: '⚙️', label: '网站设置' },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const [sideOpen, setSideOpen] = useState(false);

  function handleLogout() {
    signOut();
    nav('/login');
  }

  return (
    <div style={s.wrap}>
      {/* Mobile overlay */}
      {sideOpen && <div style={s.overlay} onClick={() => setSideOpen(false)} />}

      {/* Sidebar */}
      <aside className={`admin-sidebar${sideOpen ? ' open' : ''}`} style={s.sidebar}>
        <div style={s.sideTop}>
          <div style={s.brandIcon}>🧭</div>
          <div>
            <div style={s.brandName}>导航管理</div>
            <div style={s.brandUser}>{user?.username}</div>
          </div>
        </div>
        <nav style={s.nav}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSideOpen(false)}
              style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navActive : {}) })}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div style={s.sideBottom}>
          <a href="/" target="_blank" style={s.sideBtn}>🌐 查看前台</a>
          <button onClick={handleLogout} style={s.sideBtn}>🚪 退出登录</button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main" style={s.main}>
        {/* Topbar */}
        <header style={s.topbar}>
          <button className="admin-menu-btn" style={s.menuBtn} onClick={() => setSideOpen(v => !v)}>☰</button>
          <span style={s.pageTitle}>后台管理系统</span>
          <span style={s.userChip}>{user?.username}</span>
        </header>
        <div style={s.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap: { display: 'flex', minHeight: '100vh', background: '#f8fafc' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 49 },
  sidebar: {
    width: 220,
    background: '#1e2235',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    position: 'fixed',
    top: 0, left: 0, bottom: 0,
    zIndex: 50,
    transition: 'transform 0.25s',
  },
  sideTop: { padding: '24px 20px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #2d3350' },
  brandIcon: { fontSize: 28 },
  brandName: { fontWeight: 700, fontSize: 15 },
  brandUser: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  nav: { flex: 1, padding: '12px 10px' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', borderRadius: 8,
    fontSize: 14, color: '#94a3b8',
    textDecoration: 'none', transition: 'all 0.15s',
    marginBottom: 4,
  },
  navActive: { background: 'var(--primary)', color: '#fff' },
  sideBottom: { padding: '12px 10px', borderTop: '1px solid #2d3350', display: 'flex', flexDirection: 'column', gap: 6 },
  sideBtn: {
    display: 'block', padding: '8px 14px', borderRadius: 8,
    fontSize: 13, color: '#94a3b8', background: 'none', border: 'none',
    cursor: 'pointer', textAlign: 'left', textDecoration: 'none',
    transition: 'background 0.15s',
  },
  main: { flex: 1, marginLeft: 220, display: 'flex', flexDirection: 'column', minWidth: 0 },
  topbar: {
    background: '#fff', borderBottom: '1px solid #e5e7eb',
    padding: '0 24px', height: 56,
    display: 'flex', alignItems: 'center', gap: 12,
    position: 'sticky', top: 0, zIndex: 40,
  },
  menuBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', display: 'none', marginRight: 4 },
  pageTitle: { fontWeight: 600, fontSize: 15, flex: 1 },
  userChip: { background: '#eff2ff', color: 'var(--primary)', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
  content: { flex: 1, padding: '28px 24px', maxWidth: 1200 },
};
