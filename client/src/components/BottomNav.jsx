import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth';

export default function BottomNav() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user } = useAuth();
  const [hidden, setHidden] = useState(false);
  const timerRef = useRef(null);

  // 滑动时隐藏，停止滚动后再显示
  useEffect(() => {
    function onScroll() {
      setHidden(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setHidden(false), 500);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(timerRef.current); };
  }, []);

  // 后台、登录页不显示
  if (loc.pathname.startsWith('/admin') || loc.pathname === '/login') return null;

  const tabs = [
    { key: '/', label: '首页', icon: IconHome, onClick: () => nav('/') },
    { key: '/submit', label: '投稿', icon: IconPlus, onClick: () => nav(user ? '/submit' : '/login') },
    { key: '/me', label: '我的', icon: IconUser, onClick: () => nav(user ? '/me' : '/login') },
  ];

  return (
    <nav className={`bottom-nav${hidden ? ' hidden' : ''}`}>
      {tabs.map(t => {
        const active = loc.pathname === t.key;
        const Icon = t.icon;
        return (
          <button key={t.key} className={`bn-item${active ? ' active' : ''}`} onClick={t.onClick}>
            <span className="bn-ico"><Icon active={active} /></span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

const SZ = 24;
function IconHome() {
  return (
    <svg width={SZ} height={SZ} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" /><path d="M9.5 21v-6h5v6" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width={SZ} height={SZ} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" /><path d="M12 8.5v7M8.5 12h7" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg width={SZ} height={SZ} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" />
    </svg>
  );
}
