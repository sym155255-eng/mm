const router = require('express').Router();
const { getDB } = require('../db');

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
  const categories = db.prepare('SELECT * FROM categories WHERE visible=1 ORDER BY sort_order,id').all();
  const subCategories = db.prepare('SELECT * FROM sub_categories ORDER BY sort_order,id').all();
  const links = db.prepare('SELECT * FROM links WHERE visible=1 ORDER BY sort_order,id').all();
  const subLinks = db.prepare('SELECT * FROM sub_links ORDER BY sort_order,id').all();
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

  res.json({ categories, subCategories, links: linksWithSub, settings: settingsObj, ads, notices, banners, navs });
});

module.exports = router;
