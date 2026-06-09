import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth';

const IDLE_MS = 10 * 60 * 1000; // 10 分钟无操作自动退出

const navItems = [
  { to: '/admin/links', icon: '🔗', label: '链接管理', group: 1 },
  { to: '/admin/categories', icon: '📂', label: '分类管理', group: 1 },
  { to: '/admin/sub-categories', icon: '🏷️', label: '子分类管理', group: 1 },
  { to: '/admin/navs', icon: '🧭', label: '导航管理', group: 1 },
  { to: '/admin/pages', icon: '📄', label: '页面管理', group: 1 },
  { to: '/admin/ads', icon: '📢', label: '广告管理', group: 1 },
  { to: '/admin/notices', icon: '📣', label: '跑马灯管理', group: 1 },
  { to: '/admin/banners', icon: '🖼️', label: '图片管理', group: 1 },
  { to: '/admin/colors', icon: '🎨', label: '颜色管理', group: 1 },
  { to: '/admin/settings', icon: '⚙️', label: '网站设置', group: 1 },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const [sideOpen, setSideOpen] = useState(false);
  const [menuGroup, setMenuGroup] = useState(1); // 当前后台菜单分组（1 / 2）

  function handleLogout() {
    signOut();
    nav('/login');
  }

  // 10 分钟无操作自动退出
  const timerRef = useRef(null);
  useEffect(() => {
    function reset() {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        signOut();
        nav('/login');
        alert('已超过 10 分钟无操作，请重新登录');
      }, IDLE_MS);
    }
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset(); // 进入后立即开始计时
    return () => {
      clearTimeout(timerRef.current);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [signOut, nav]);

  return (
    <div style={s.wrap}>
      {/* Mobile overlay */}
      {sideOpen && <div style={s.overlay} onClick={() => setSideOpen(false)} />}

      {/* Sidebar */}
      <aside className={`admin-sidebar${sideOpen ? ' open' : ''}`} style={s.sidebar}>
        <div style={s.sideTop}>
          <div style={s.brandIcon}>🧭</div>
          <div style={{ flex: 1 }}>
            <div style={s.brandName}>导航管理</div>
            <div style={s.brandUser}>{user?.username}</div>
          </div>
          <div style={s.groupSwitch}>
            <button style={{ ...s.groupBtn, ...(menuGroup === 1 ? s.groupBtnActive : {}) }} onClick={() => setMenuGroup(1)}>1</button>
            <button style={{ ...s.groupBtn, ...(menuGroup === 2 ? s.groupBtnActive : {}) }} onClick={() => setMenuGroup(2)}>2</button>
          </div>
        </div>
        <nav style={s.nav}>
          {navItems.filter(item => item.group === menuGroup).map(item => (
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
        <header className="admin-topbar" style={s.topbar}>
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
  groupSwitch: { display: 'flex', gap: 8 },
  groupBtn: { width: 32, height: 32, borderRadius: 8, border: '1px solid #3a4060', background: 'transparent', color: '#94a3b8', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
  groupBtnActive: { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' },
  brandIcon: { fontSize: 22 },
  brandName: { fontWeight: 700, fontSize: 13 },
  brandUser: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
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
