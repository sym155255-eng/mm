import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/auth';
import Home from './pages/Home';
import SiteDetail from './pages/SiteDetail';
import NavPage from './pages/NavPage';
import PageView from './pages/PageView';
import ForumPage from './pages/ForumPage';
import PostDetail from './pages/PostDetail';
import P2Sections from './pages/admin/P2Sections';
import P2Boards from './pages/admin/P2Boards';
import P2Colors from './pages/admin/P2Colors';
import P2Posts from './pages/admin/P2Posts';
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

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sites/:id" element={<SiteDetail />} />
        <Route path="/home2" element={<ForumPage />} />
        <Route path="/post/:id" element={<PostDetail />} />
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
          <Route path="p2/sections" element={<P2Sections />} />
          <Route path="p2/boards" element={<P2Boards />} />
          <Route path="p2/posts" element={<P2Posts />} />
          <Route path="p2/colors" element={<P2Colors />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
