import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

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

  return <AuthContext.Provider value={{ user, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
