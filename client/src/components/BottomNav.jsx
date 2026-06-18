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

  function goPost() {
    const box = document.getElementById('comment-box');
    if (box) {
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const ta = box.querySelector('textarea');
      if (ta) setTimeout(() => ta.focus(), 400);
    } else {
      nav('/'); // 当前页没有评论框，回首页
    }
  }
  function goMe() {
    nav(user ? '/me' : '/login');
  }

  const isHome = loc.pathname === '/';
  return (
    <nav className={`bottom-nav${hidden ? ' hidden' : ''}`}>
      <button className={`bn-item${isHome ? ' active' : ''}`} onClick={() => nav('/')}>
        <span className="bn-ico">🏠</span><span>首页</span>
      </button>
      <button className="bn-item" onClick={goPost}>
        <span className="bn-ico">✍️</span><span>投稿</span>
      </button>
      <button className={`bn-item${loc.pathname === '/me' ? ' active' : ''}`} onClick={goMe}>
        <span className="bn-ico">👤</span><span>我的</span>
      </button>
    </nav>
  );
}
