const BASE = '/api';

function getToken() {
  return localStorage.getItem('nav_token');
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

export async function fetchPublicData() {
  const r = await fetch(`${BASE}/public/data`);
  return r.json();
}

export async function fetchLinkDetail(id) {
  const r = await fetch(`${BASE}/public/link/${id}`);
  return r.json();
}

export async function login(username, password) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return r.json();
}

export async function changePassword(oldPassword, newPassword) {
  const r = await fetch(`${BASE}/auth/change-password`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  return r.json();
}

// Settings
export async function getSettings() {
  const r = await fetch(`${BASE}/admin/settings`, { headers: authHeaders() });
  return r.json();
}
export async function saveSettings(data) {
  const r = await fetch(`${BASE}/admin/settings`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}

// Categories
export async function getCategories() {
  const r = await fetch(`${BASE}/admin/categories`, { headers: authHeaders() });
  return r.json();
}
export async function createCategory(data) {
  const r = await fetch(`${BASE}/admin/categories`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
export async function updateCategory(id, data) {
  const r = await fetch(`${BASE}/admin/categories/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
export async function deleteCategory(id) {
  const r = await fetch(`${BASE}/admin/categories/${id}`, { method: 'DELETE', headers: authHeaders() });
  return r.json();
}

// Links
export async function getLinks() {
  const r = await fetch(`${BASE}/admin/links`, { headers: authHeaders() });
  return r.json();
}
export async function createLink(data) {
  const r = await fetch(`${BASE}/admin/links`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
export async function updateLink(id, data) {
  const r = await fetch(`${BASE}/admin/links/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
export async function deleteLink(id) {
  const r = await fetch(`${BASE}/admin/links/${id}`, { method: 'DELETE', headers: authHeaders() });
  return r.json();
}

// Sub Categories
export async function getSubCategories() {
  const r = await fetch(`${BASE}/admin/sub-categories`, { headers: authHeaders() });
  return r.json();
}
export async function createSubCategory(data) {
  const r = await fetch(`${BASE}/admin/sub-categories`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
export async function updateSubCategory(id, data) {
  const r = await fetch(`${BASE}/admin/sub-categories/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
export async function deleteSubCategory(id) {
  const r = await fetch(`${BASE}/admin/sub-categories/${id}`, { method: 'DELETE', headers: authHeaders() });
  return r.json();
}

// Sub Links
export async function getSubLinks(linkId) {
  const r = await fetch(`${BASE}/admin/links/${linkId}/sub`, { headers: authHeaders() });
  return r.json();
}
export async function createSubLink(linkId, data) {
  const r = await fetch(`${BASE}/admin/links/${linkId}/sub`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
export async function updateSubLink(id, data) {
  const r = await fetch(`${BASE}/admin/sub/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
export async function deleteSubLink(id) {
  const r = await fetch(`${BASE}/admin/sub/${id}`, { method: 'DELETE', headers: authHeaders() });
  return r.json();
}

// Ads
export async function getAds() {
  const r = await fetch(`${BASE}/admin/ads`, { headers: authHeaders() });
  return r.json();
}
export async function createAd(data) {
  const r = await fetch(`${BASE}/admin/ads`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
export async function updateAd(id, data) {
  const r = await fetch(`${BASE}/admin/ads/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
export async function deleteAd(id) {
  const r = await fetch(`${BASE}/admin/ads/${id}`, { method: 'DELETE', headers: authHeaders() });
  return r.json();
}

// Notices (跑马灯)
export async function getNotices() {
  const r = await fetch(`${BASE}/admin/notices`, { headers: authHeaders() });
  return r.json();
}
export async function createNotice(data) {
  const r = await fetch(`${BASE}/admin/notices`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
export async function updateNotice(id, data) {
  const r = await fetch(`${BASE}/admin/notices/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
export async function deleteNotice(id) {
  const r = await fetch(`${BASE}/admin/notices/${id}`, { method: 'DELETE', headers: authHeaders() });
  return r.json();
}

// 批量重抓图标
export async function refetchIcons() {
  const r = await fetch(`${BASE}/admin/refetch-icons`, { method: 'POST', headers: authHeaders() });
  return r.json();
}

// 上传图标图片
export async function uploadIcon(file) {
  const fd = new FormData();
  fd.append('icon', file);
  const r = await fetch(`${BASE}/admin/upload-icon`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` }, // 不要手动设 Content-Type
    body: fd,
  });
  return r.json();
}

// Banners (横幅图片)
export async function getBanners() {
  const r = await fetch(`${BASE}/admin/banners`, { headers: authHeaders() });
  return r.json();
}
export async function createBanner(data) {
  const r = await fetch(`${BASE}/admin/banners`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
export async function updateBanner(id, data) {
  const r = await fetch(`${BASE}/admin/banners/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
export async function deleteBanner(id) {
  const r = await fetch(`${BASE}/admin/banners/${id}`, { method: 'DELETE', headers: authHeaders() });
  return r.json();
}

// Navs (横向导航)
export async function getNavs() {
  const r = await fetch(`${BASE}/admin/navs`, { headers: authHeaders() });
  return r.json();
}
export async function createNav(data) {
  const r = await fetch(`${BASE}/admin/navs`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
export async function updateNav(id, data) {
  const r = await fetch(`${BASE}/admin/navs/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
export async function deleteNav(id) {
  const r = await fetch(`${BASE}/admin/navs/${id}`, { method: 'DELETE', headers: authHeaders() });
  return r.json();
}
