import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth';
import { useEffect, useState } from 'react';

const navItems = [
  { to: '/admin', label: '数据统计', icon: '📊', end: true },
  { to: '/admin/links', label: '导航管理', icon: '🔗' },
  { to: '/admin/categories', label: '分类管理', icon: '📁' },
  { to: '/admin/users', label: '用户管理', icon: '👥' },
  { to: '/admin/settings', label: '网站设置', icon: '⚙️' },
  { to: '/admin/textcolors', label: '文字管理', icon: '🎨' },
  { to: '/admin/ads', label: '广告栏', icon: '📢' },
];

export default function AdminLayout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin) navigate('/login');
  }, [user, isAdmin]);

  if (!user || !isAdmin) return null;

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="admin-layout">
      {/* 桌面端侧边栏 */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>🧭</span> 导航管理
        </div>
        <nav className="admin-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}
          <Link to="/" className="admin-nav-item admin-nav-home">
            <span>🏠</span> 返回前台
          </Link>
        </nav>
        <div className="admin-sidebar-footer">
          <span>👤 {user.username}</span>
          <button className="logout-btn" onClick={() => { logout(); navigate('/'); }}>退出</button>
        </div>
      </aside>

      <div className="admin-main">
        <Outlet />
      </div>

      {/* 移动端抽屉遮罩 */}
      {drawerOpen && <div className="admin-drawer-overlay" onClick={closeDrawer} />}

      {/* 移动端左侧抽屉 */}
      <div className={`admin-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="admin-drawer-header">
          <span>🧭 导航管理</span>
          <button className="admin-drawer-close" onClick={closeDrawer}>✕</button>
        </div>
        <nav className="admin-drawer-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              onClick={closeDrawer}
            >
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}
          <Link to="/" className="admin-nav-item admin-nav-home" onClick={closeDrawer}>
            <span>🏠</span> 返回前台
          </Link>
        </nav>
        <div className="admin-drawer-footer">
          <span>👤 {user.username}</span>
          <button className="logout-btn" onClick={() => { logout(); navigate('/'); }}>退出</button>
        </div>
      </div>

      {/* 移动端悬浮菜单按钮 */}
      <button
        className="admin-menu-btn"
        onClick={() => setDrawerOpen(o => !o)}
        aria-label="打开菜单"
      >
        ☰
      </button>
    </div>
  );
}
