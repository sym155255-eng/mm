import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/auth';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminLayout from './pages/admin/Layout';
import Categories from './pages/admin/Categories';
import Links from './pages/admin/Links';
import Ads from './pages/admin/Ads';
import Settings from './pages/admin/Settings';
import Colors from './pages/admin/Colors';
import SubCategories from './pages/admin/SubCategories';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/admin/links" replace />} />
          <Route path="links" element={<Links />} />
          <Route path="categories" element={<Categories />} />
          <Route path="sub-categories" element={<SubCategories />} />
          <Route path="ads" element={<Ads />} />
          <Route path="colors" element={<Colors />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
