import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './store/auth';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLayout from './pages/admin/Layout';
import Stats from './pages/admin/Stats';
import AdminLinks from './pages/admin/Links';
import AdminCategories from './pages/admin/Categories';
import AdminUsers from './pages/admin/Users';
import AdminSettings from './pages/admin/Settings';
import TextColors from './pages/admin/TextColors';
import AdminAds from './pages/admin/Ads';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Stats />} />
            <Route path="links" element={<AdminLinks />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="textcolors" element={<TextColors />} />
            <Route path="ads" element={<AdminAds />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
