import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AuthContext = createContext(null);
const IDLE_MS = 20 * 60 * 1000; // 登录用户 20 分钟无操作自动退出

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nav_user')); } catch { return null; }
  });

  function signIn(token, userObj) {
    localStorage.setItem('nav_token', token);
    localStorage.setItem('nav_user', JSON.stringify(userObj));
    setUser(userObj);
  }

  function signOut() {
    localStorage.removeItem('nav_token');
    localStorage.removeItem('nav_user');
    setUser(null);
  }

  // 全局无操作自动退出（基于"最后操作时间戳"核对，手机切后台/锁屏回来也可靠）
  const lastActiveRef = useRef(Date.now());
  useEffect(() => {
    if (!user) return;
    lastActiveRef.current = Date.now();
    const reset = () => { lastActiveRef.current = Date.now(); };
    const check = () => {
      if (Date.now() - lastActiveRef.current >= IDLE_MS) {
        signOut();
      }
    };
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);
    const ticker = setInterval(check, 30 * 1000);
    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
      clearInterval(ticker);
    };
  }, [user]);

  return <AuthContext.Provider value={{ user, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
