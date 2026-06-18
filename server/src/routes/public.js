const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { getDB } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const captcha = require('../captcha');

// 获取验证码
router.get('/captcha', (req, res) => {
  res.json(captcha.issue());
});

// 用户上传目录（评论图片）
const UPLOADS_DIR = path.join(__dirname, '../../../data/uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || '.png').toLowerCase();
      cb(null, `c_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 最大 5MB
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

// 评论图片上传（需登录）
router.post('/comment-image', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请上传图片文件' });
  res.json({ ok: true, path: `/uploads/${req.file.filename}` });
});

// 用户投稿：提交一个新卡片链接（需登录，待审核）
router.post('/submission', authMiddleware, (req, res) => {
  const db = getDB();
  const title = String(req.body.title || '').trim().slice(0, 100);
  let url = String(req.body.url || '').trim().slice(0, 500);
  const description = String(req.body.description || '').trim().slice(0, 300);
  const category_id = req.body.category_id ? Number(req.body.category_id) : null;
  if (!title) return res.status(400).json({ error: '请填写标题' });
  if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: '请填写正确的网址（http/https）' });
  if (category_id && !db.prepare('SELECT id FROM categories WHERE id=?').get(category_id)) {
    return res.status(400).json({ error: '分类无效' });
  }
  const u = db.prepare('SELECT username, nickname, role FROM users WHERE id=?').get(req.user.id);
  const nickname = u ? (u.role === 'admin' ? '管理员' : (u.nickname || u.username)) : '';
  db.prepare('INSERT INTO submissions (user_id, nickname, category_id, title, url, description) VALUES (?, ?, ?, ?, ?, ?)')
    .run(req.user.id, nickname, category_id, title, url, description);
  res.json({ ok: true });
});

// 我的投稿记录（需登录）
router.get('/my-submissions', authMiddleware, (req, res) => {
  const db = getDB();
  const rows = db.prepare('SELECT s.id, s.title, s.url, s.status, s.created_at, c.name AS category_name FROM submissions s LEFT JOIN categories c ON c.id=s.category_id WHERE s.user_id=? ORDER BY s.id DESC').all(req.user.id);
  res.json(rows);
});

// 获取某链接的评论（分页）
router.get('/comments/:linkId', (req, res) => {
  const db = getDB();
  const linkId = req.params.linkId;
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);
  const offset = Math.max(parseInt(req.query.offset) || 0, 0);
  const total = db.prepare('SELECT COUNT(*) AS c FROM comments WHERE link_id=? AND visible=1').get(linkId).c;
  const items = db.prepare(`
    SELECT c.id, c.link_id, c.content, c.nickname, c.image_url, c.created_at, u.nickname_color, u.role
    FROM comments c LEFT JOIN users u ON u.id = c.user_id
    WHERE c.link_id=? AND c.visible=1 ORDER BY c.id DESC LIMIT ? OFFSET ?
  `).all(linkId, limit, offset);
  res.json({ items, total });
});

// 发表评论（需登录 + 图形验证码，可带图片）
router.post('/comment', authMiddleware, (req, res) => {
  const { link_id, content, image_url, captcha_token, captcha_text } = req.body || {};
  // 校验验证码
  if (!captcha.verify(captcha_token, captcha_text)) {
    return res.status(400).json({ error: '验证码错误或已过期' });
  }
  const text = String(content || '').trim();
  const img = String(image_url || '').trim();
  if (!text && !img) return res.status(400).json({ error: '评论内容不能为空' });
  if (text.length > 1000) return res.status(400).json({ error: '评论内容过长' });
  // 图片只接受本站 /uploads 路径，防止 XSS / 盗链
  if (img && !/^\/uploads\/[\w.\-]+$/.test(img)) return res.status(400).json({ error: '图片地址无效' });
  const db = getDB();
  const link = db.prepare('SELECT id FROM links WHERE id=?').get(link_id);
  if (!link) return res.status(404).json({ error: '链接不存在' });
  const u = db.prepare('SELECT id, username, nickname FROM users WHERE id=?').get(req.user.id);
  const name = (u && (u.nickname || u.username)) || '匿名';
  const info = db.prepare('INSERT INTO comments (link_id, content, nickname, user_id, image_url) VALUES (?, ?, ?, ?, ?)').run(link_id, text, name, req.user.id, img);
  const row = db.prepare('SELECT id, link_id, content, nickname, image_url, created_at FROM comments WHERE id=?').get(info.lastInsertRowid);
  res.json(row);
});

// 单个链接详情（浏览量 +1）
router.get('/link/:id', (req, res) => {
  const db = getDB();
  const link = db.prepare('SELECT * FROM links WHERE id=?').get(req.params.id);
  if (!link) return res.status(404).json({ error: '链接不存在' });
  // 浏览量 +1
  db.prepare('UPDATE links SET views=COALESCE(views,0)+1 WHERE id=?').run(req.params.id);
  link.views = (link.views || 0) + 1;
  // 分类、子分类名
  const cat = link.category_id ? db.prepare('SELECT name FROM categories WHERE id=?').get(link.category_id) : null;
  const sub = link.sub_category_id ? db.prepare('SELECT name FROM sub_categories WHERE id=?').get(link.sub_category_id) : null;
  link.category_name = cat ? cat.name : '';
  link.sub_category_name = sub ? sub.name : '';
  // 子链接
  link.sub_links = db.prepare('SELECT * FROM sub_links WHERE link_id=? ORDER BY sort_order,id').all(req.params.id);
  res.json(link);
});

// 单个独立页面
router.get('/page-view/:id', (req, res) => {
  const db = getDB();
  const page = db.prepare('SELECT * FROM pages WHERE id=?').get(req.params.id);
  if (!page) return res.status(404).json({ error: '页面不存在' });
  res.json(page);
});

// 单个导航详情（自定义内容页）
router.get('/nav/:id', (req, res) => {
  const db = getDB();
  const nav = db.prepare('SELECT * FROM navs WHERE id=?').get(req.params.id);
  if (!nav) return res.status(404).json({ error: '导航不存在' });
  res.json(nav);
});

router.get('/data', (req, res) => {
  const db = getDB();
  const group = req.query.group || 'home';
  const categories = db.prepare("SELECT * FROM categories WHERE visible=1 AND IFNULL(page_group,'home')=? ORDER BY sort_order,id").all(group);
  const catIds = new Set(categories.map(c => c.id));
  const subCategories = db.prepare('SELECT * FROM sub_categories ORDER BY sort_order,id').all();
  const allLinks = db.prepare('SELECT * FROM links WHERE visible=1 ORDER BY sort_order,id').all();
  const links = allLinks.filter(l => catIds.has(l.category_id) || (group === 'home' && !l.category_id));
  const subLinks = db.prepare('SELECT * FROM sub_links ORDER BY sort_order,id').all();
  const adSubLinks = db.prepare('SELECT * FROM ad_sub_links ORDER BY sort_order,id').all();
  const settings = db.prepare('SELECT * FROM settings').all();
  const ads = db.prepare('SELECT * FROM ads WHERE visible=1 ORDER BY sort_order,id').all();
  const notices = db.prepare('SELECT * FROM notices WHERE visible=1 ORDER BY sort_order,id').all();
  const banners = db.prepare('SELECT * FROM banners WHERE visible=1 ORDER BY sort_order,id').all();
  const navs = db.prepare('SELECT * FROM navs WHERE visible=1 ORDER BY sort_order,id').all();

  const settingsObj = {};
  settings.forEach(s => settingsObj[s.key] = s.value);

  // 把子链接挂到对应 link 上
  const subMap = {};
  subLinks.forEach(sl => { if (!subMap[sl.link_id]) subMap[sl.link_id] = []; subMap[sl.link_id].push(sl); });
  const linksWithSub = links.map(l => ({ ...l, sub_links: subMap[l.id] || [] }));

  // 把子链接挂到对应广告上
  const adSubMap = {};
  adSubLinks.forEach(sl => { if (!adSubMap[sl.ad_id]) adSubMap[sl.ad_id] = []; adSubMap[sl.ad_id].push(sl); });
  const adsWithSub = ads.map(a => ({ ...a, sub_links: adSubMap[a.id] || [] }));

  res.json({ categories, subCategories, links: linksWithSub, settings: settingsObj, ads: adsWithSub, notices, banners, navs });
});

module.exports = router;
