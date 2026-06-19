const BASE = '/api';

function getToken() {
  return localStorage.getItem('nav_token');
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

export async function fetchPublicData(group) {
  const q = group ? `?group=${encodeURIComponent(group)}` : '';
  const r = await fetch(`${BASE}/public/data${q}`);
  return r.json();
}

export async function fetchLinkDetail(id) {
  const r = await fetch(`${BASE}/public/link/${id}`);
  return r.json();
}

export async function fetchNavDetail(id) {
  const r = await fetch(`${BASE}/public/nav/${id}`);
  return r.json();
}

// 投稿
export async function submitContribution(data) {
  const r = await fetch(`${BASE}/public/submission`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
export async function getMySubmissions() {
  const r = await fetch(`${BASE}/public/my-submissions`, { headers: authHeaders() });
  return r.json();
}
export async function getSubmissions() {
  const r = await fetch(`${BASE}/admin/submissions`, { headers: authHeaders() });
  return r.json();
}
export async function approveSubmission(id) {
  const r = await fetch(`${BASE}/admin/submissions/${id}/approve`, { method: 'POST', headers: authHeaders() });
  return r.json();
}
export async function rejectSubmission(id) {
  const r = await fetch(`${BASE}/admin/submissions/${id}/reject`, { method: 'POST', headers: authHeaders() });
  return r.json();
}
export async function deleteSubmission(id) {
  const r = await fetch(`${BASE}/admin/submissions/${id}`, { method: 'DELETE', headers: authHeaders() });
  return r.json();
}

// 评论
export async function fetchCaptcha() {
  const r = await fetch(`${BASE}/public/captcha`);
  return r.json();
}
export async function fetchComments(linkId, offset = 0, limit = 20) {
  const r = await fetch(`${BASE}/public/comments/${linkId}?offset=${offset}&limit=${limit}`);
  return r.json();
}
export async function postComment(data) {
  const r = await fetch(`${BASE}/public/comment`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return r.json();
}
export async function uploadCommentImage(file) {
  const fd = new FormData();
  fd.append('image', file);
  const r = await fetch(`${BASE}/public/comment-image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  return r.json();
}

// 注册
export async function register(username, password, nickname, captchaToken, captchaText) {
  const r = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, nickname, captcha_token: captchaToken, captcha_text: captchaText }),
  });
  return r.json();
}

// 用户管理（后台）
export async function getUsers() {
  const r = await fetch(`${BASE}/admin/users`, { headers: authHeaders() });
  return r.json();
}
export async function deleteUser(id) {
  const r = await fetch(`${BASE}/admin/users/${id}`, { method: 'DELETE', headers: authHeaders() });
  return r.json();
}
export async function updateUserColors(id, data) {
  const r = await fetch(`${BASE}/admin/users/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
// 评论管理（后台）
export async function getAdminComments() {
  const r = await fetch(`${BASE}/admin/comments`, { headers: authHeaders() });
  return r.json();
}
export async function deleteComment(id) {
  const r = await fetch(`${BASE}/admin/comments/${id}`, { method: 'DELETE', headers: authHeaders() });
  return r.json();
}

export async function login(username, password, captchaToken, captchaText) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, captcha_token: captchaToken, captcha_text: captchaText }),
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
export async function getCategories(group) {
  const q = group ? `?group=${encodeURIComponent(group)}` : '';
  const r = await fetch(`${BASE}/admin/categories${q}`, { headers: authHeaders() });
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
export async function getLinks(group) {
  const q = group ? `?group=${encodeURIComponent(group)}` : '';
  const r = await fetch(`${BASE}/admin/links${q}`, { headers: authHeaders() });
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

// 描述渐变色
export async function setLinkDescGradient(id, desc_gradient) {
  const r = await fetch(`${BASE}/admin/links/${id}/desc-gradient`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ desc_gradient }) });
  return r.json();
}
export async function setAdDescGradient(id, desc_gradient) {
  const r = await fetch(`${BASE}/admin/ads/${id}/desc-gradient`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ desc_gradient }) });
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
// 广告子链接
export async function getAdSubLinks(adId) {
  const r = await fetch(`${BASE}/admin/ads/${adId}/sub`, { headers: authHeaders() });
  return r.json();
}
export async function createAdSubLink(adId, data) {
  const r = await fetch(`${BASE}/admin/ads/${adId}/sub`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
export async function updateAdSubLink(id, data) {
  const r = await fetch(`${BASE}/admin/ad-sub/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
export async function deleteAdSubLink(id) {
  const r = await fetch(`${BASE}/admin/ad-sub/${id}`, { method: 'DELETE', headers: authHeaders() });
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

// 从网址抓取图标
export async function fetchIconFromUrl(url) {
  const r = await fetch(`${BASE}/admin/fetch-icon`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ url }) });
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

// Pages (独立页面)
export async function fetchPageView(id) {
  const r = await fetch(`${BASE}/public/page-view/${id}`);
  return r.json();
}
export async function getPages() {
  const r = await fetch(`${BASE}/admin/pages`, { headers: authHeaders() });
  return r.json();
}
export async function createPage(data) {
  const r = await fetch(`${BASE}/admin/pages`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
export async function updatePage(id, data) {
  const r = await fetch(`${BASE}/admin/pages/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return r.json();
}
export async function deletePage(id) {
  const r = await fetch(`${BASE}/admin/pages/${id}`, { method: 'DELETE', headers: authHeaders() });
  return r.json();
}
