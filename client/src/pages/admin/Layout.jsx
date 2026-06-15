import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth';
import { getSettings, saveSettings } from '../../api';

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
  // 组 2：第二页（/home2 论坛样式）独立管理
  { to: '/admin/p2/sections', icon: '🗂️', label: '分区管理', group: 2 },
  { to: '/admin/p2/boards', icon: '📋', label: '子版块管理', group: 2 },
  { to: '/admin/p2/posts', icon: '📝', label: '帖子管理', group: 2 },
  { to: '/admin/p2/colors', icon: '🎨', label: '颜色管理', group: 2 },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const [sideOpen, setSideOpen] = useState(false);
  const [menuGroup, setMenuGroup] = useState(1); // 当前后台菜单分组（1 / 2）
  const [adStyle, setAdStyle] = useState('1');   // 手机广告样式 1=卡片 2=圆形

  useEffect(() => {
    getSettings().then(s => setAdStyle(s?.mobile_ad_style === '2' ? '2' : '1')).catch(() => {});
  }, []);
  async function changeAdStyle(v) {
    setAdStyle(v);
    try { await saveSettings({ mobile_ad_style: v }); } catch {}
  }

  function handleLogout() {
    signOut();
    nav('/login');
  }

  // 10 分钟无操作自动退出（手机端可靠：基于"最后操作时间戳"核对，
  // 不只依赖 setTimeout——手机切后台/锁屏会暂停定时器，回到页面时主动核对）
  const lastActiveRef = useRef(Date.now());
  const timerRef = useRef(null);
  useEffect(() => {
    function doLogout() {
      clearTimeout(timerRef.current);
      signOut();
      nav('/login');
      alert('已超过 10 分钟无操作，请重新登录');
    }
    function check() {
      if (Date.now() - lastActiveRef.current >= IDLE_MS) doLogout();
    }
    function reset() {
      lastActiveRef.current = Date.now();
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(doLogout, IDLE_MS);
    }
    function onVisible() {
      if (document.visibilityState === 'visible') check(); // 回到页面立即核对
    }
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);
    const ticker = setInterval(check, 30 * 1000); // 兜底：每 30 秒核对一次
    reset(); // 进入后立即开始计时
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(ticker);
      events.forEach(e => window.removeEventListener(e, reset));
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
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
          {menuGroup === 2 && (
            <div style={s.groupHint}>
              第二页（论坛样式·独立）
              <a href="/home2" target="_blank" style={s.viewLink}>查看第二页 ↗</a>
            </div>
          )}
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
          <div style={s.adStyleWrap}>
            <span style={s.adStyleLabel}>手机广告</span>
            <div style={s.adSwitch}>
              <button style={{ ...s.adBtn, ...(adStyle === '1' ? s.adBtnActive : {}) }} onClick={() => changeAdStyle('1')} title="卡片样式">1</button>
              <button style={{ ...s.adBtn, ...(adStyle === '2' ? s.adBtnActive : {}) }} onClick={() => changeAdStyle('2')} title="圆形图标样式">2</button>
            </div>
          </div>
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
  groupSwitch: { display: 'inline-flex', background: '#2a3050', borderRadius: 9, padding: 3, gap: 2 },
  groupBtn: { width: 30, height: 26, borderRadius: 6, border: 'none', background: 'transparent', color: '#94a3b8', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, transition: 'all .15s' },
  groupBtnActive: { background: 'var(--primary)', color: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' },
  brandIcon: { fontSize: 22 },
  brandName: { fontWeight: 700, fontSize: 13 },
  brandUser: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  nav: { flex: 1, padding: '12px 10px', overflowY: 'auto', minHeight: 0 },
  groupHint: { display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 12px 12px', fontSize: 12, color: '#64748b' },
  viewLink: { color: 'var(--primary)', fontSize: 12, fontWeight: 600, textDecoration: 'none' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '6px 14px', borderRadius: 8,
    fontSize: 14, color: '#94a3b8',
    textDecoration: 'none', transition: 'all 0.15s',
    marginBottom: 1,
  },
  navActive: { background: 'var(--primary)', color: '#fff' },
  sideBottom: { padding: '12px 10px', borderTop: '1px solid #2d3350', display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 },
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
  adStyleWrap: { display: 'flex', alignItems: 'center', gap: 8, marginRight: 12 },
  adStyleLabel: { fontSize: 12, color: '#9ca3af' },
  adSwitch: { display: 'inline-flex', background: '#eef1f6', borderRadius: 8, padding: 2, gap: 2 },
  adBtn: { width: 28, height: 24, border: 'none', background: 'transparent', color: '#6b7280', fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
  adBtnActive: { background: 'var(--primary)', color: '#fff' },
  userChip: { background: '#eff2ff', color: 'var(--primary)', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
  content: { flex: 1, padding: '28px 24px', maxWidth: 1200 },
};
