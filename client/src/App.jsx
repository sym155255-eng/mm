import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/auth';
import Home from './pages/Home';
import SiteDetail from './pages/SiteDetail';
import NavPage from './pages/NavPage';
import PageView from './pages/PageView';
import Me from './pages/Me';
import BottomNav from './components/BottomNav';
import Pages from './pages/admin/Pages';
import Login from './pages/Login';
import AdminLayout from './pages/admin/Layout';
import Categories from './pages/admin/Categories';
import Links from './pages/admin/Links';
import Ads from './pages/admin/Ads';
import Settings from './pages/admin/Settings';
import Colors from './pages/admin/Colors';
import SubCategories from './pages/admin/SubCategories';
import Notices from './pages/admin/Notices';
import Banners from './pages/admin/Banners';
import Navs from './pages/admin/Navs';
import Users from './pages/admin/Users';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/me" element={<Me />} />
        <Route path="/sites/:id" element={<SiteDetail />} />
        <Route path="/page/:id" element={<NavPage />} />
        <Route path="/p/:id" element={<PageView />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/admin/links" replace />} />
          <Route path="links" element={<Links />} />
          <Route path="categories" element={<Categories />} />
          <Route path="sub-categories" element={<SubCategories />} />
          <Route path="ads" element={<Ads />} />
          <Route path="notices" element={<Notices />} />
          <Route path="banners" element={<Banners />} />
          <Route path="navs" element={<Navs />} />
          <Route path="pages" element={<Pages />} />
          <Route path="colors" element={<Colors />} />
          <Route path="settings" element={<Settings />} />
          <Route path="users" element={<Users />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </AuthProvider>
  );
}
