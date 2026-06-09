const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { getDB } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { broadcast } = require('../sse');
const { fetchFavicon, ICONS_DIR } = require('../favicon');

router.use(authMiddleware);

function db() { return getDB(); }

// ── 图标上传 ──────────────────────────────────────────────
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, ICONS_DIR),
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || '.png').toLowerCase();
      cb(null, `up_${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 最大 5MB
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});
router.post('/upload-icon', upload.single('icon'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请上传图片文件' });
  res.json({ ok: true, path: `/icons/${req.file.filename}` });
});

// ── Settings ──────────────────────────────────────────────
router.get('/settings', (req, res) => {
  const rows = db().prepare('SELECT * FROM settings').all();
  const obj = {};
  rows.forEach(r => obj[r.key] = r.value);
  res.json(obj);
});

router.put('/settings', (req, res) => {
  const d = db();
  Object.entries(req.body).forEach(([k, v]) => {
    d.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(k, String(v));
  });
  broadcast('update');
  res.json({ ok: true });
});

// ── Categories ────────────────────────────────────────────
router.get('/categories', (req, res) => {
  res.json(db().prepare('SELECT * FROM categories ORDER BY sort_order,id').all());
});

router.post('/categories', (req, res) => {
  const { name, icon = '🔗', sort_order = 0, visible = 1 } = req.body;
  const r = db().prepare('INSERT INTO categories (name,icon,sort_order,visible) VALUES (?,?,?,?)').run(name, icon, sort_order, visible);
  broadcast('update');
  res.json({ id: r.lastInsertRowid });
});

router.put('/categories/:id', (req, res) => {
  const { name, icon, sort_order, visible } = req.body;
  db().prepare('UPDATE categories SET name=?,icon=?,sort_order=?,visible=? WHERE id=?').run(name, icon, sort_order, visible, req.params.id);
  broadcast('update');
  res.json({ ok: true });
});

router.delete('/categories/:id', (req, res) => {
  db().prepare('DELETE FROM categories WHERE id=?').run(req.params.id);
  broadcast('update');
  res.json({ ok: true });
});

// ── Links ─────────────────────────────────────────────────
router.get('/links', (req, res) => {
  res.json(db().prepare('SELECT * FROM links ORDER BY sort_order,id').all());
});

router.post('/links', (req, res) => {
  const { category_id, sub_category_id = null, title, url, icon = '', description = '', title_color = '', desc_color = '', badge = '', badge_color = '', sort_order = 0, visible = 1 } = req.body;
  const r = db().prepare('INSERT INTO links (category_id,sub_category_id,title,url,icon,description,title_color,desc_color,badge,badge_color,sort_order,visible) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(category_id || null, sub_category_id || null, title, url, icon, description, title_color, desc_color, badge, badge_color, sort_order, visible);
  const newId = r.lastInsertRowid;
  // 无自定义图标 → 后台抓取并存本地，完成后更新该链接
  if (!icon && url) {
    fetchFavicon(url).then(localPath => {
      if (localPath) { db().prepare('UPDATE links SET icon=? WHERE id=?').run(localPath, newId); broadcast('update'); }
    }).catch(() => {});
  }
  broadcast('update');
  res.json({ id: newId });
});

router.put('/links/:id', (req, res) => {
  const { category_id, sub_category_id = null, title, url, icon, description, title_color = '', desc_color = '', badge = '', badge_color = '', sort_order, visible } = req.body;
  db().prepare('UPDATE links SET category_id=?,sub_category_id=?,title=?,url=?,icon=?,description=?,title_color=?,desc_color=?,badge=?,badge_color=?,sort_order=?,visible=? WHERE id=?').run(category_id || null, sub_category_id || null, title, url, icon, description, title_color, desc_color, badge, badge_color, sort_order, visible, req.params.id);
  // 图标留空且填了网址 → 抓取本地图标
  if (!icon && url) {
    fetchFavicon(url).then(localPath => {
      if (localPath) { db().prepare('UPDATE links SET icon=? WHERE id=?').run(localPath, req.params.id); broadcast('update'); }
    }).catch(() => {});
  }
  broadcast('update');
  res.json({ ok: true });
});

router.delete('/links/:id', (req, res) => {
  db().prepare('DELETE FROM links WHERE id=?').run(req.params.id);
  broadcast('update');
  res.json({ ok: true });
});

// 批量重新抓取所有链接图标 —— 后台异步处理，接口立即返回
let refetchRunning = false;
router.post('/refetch-icons', (req, res) => {
  if (refetchRunning) return res.json({ ok: true, running: true, message: '已有抓取任务在进行中' });
  const links = db().prepare('SELECT id, url FROM links').all().filter(l => l.url);
  res.json({ ok: true, started: true, total: links.length });

  // 后台跑，抓到一个更新一个，前端轮询/SSE 会自动刷新
  refetchRunning = true;
  (async () => {
    for (const l of links) {
      try {
        const p = await fetchFavicon(l.url);
        if (p) { db().prepare('UPDATE links SET icon=? WHERE id=?').run(p, l.id); broadcast('update'); }
      } catch {}
    }
    refetchRunning = false;
    broadcast('update');
  })();
});

// ── Sub Categories ────────────────────────────────────────
router.get('/sub-categories', (req, res) => {
  res.json(db().prepare('SELECT * FROM sub_categories ORDER BY sort_order,id').all());
});
router.post('/sub-categories', (req, res) => {
  const { category_id, name, sort_order = 0 } = req.body;
  const r = db().prepare('INSERT INTO sub_categories (category_id,name,sort_order) VALUES (?,?,?)').run(category_id, name, sort_order);
  broadcast('update');
  res.json({ id: r.lastInsertRowid });
});
router.put('/sub-categories/:id', (req, res) => {
  const { name, sort_order = 0 } = req.body;
  db().prepare('UPDATE sub_categories SET name=?,sort_order=? WHERE id=?').run(name, sort_order, req.params.id);
  broadcast('update');
  res.json({ ok: true });
});
router.delete('/sub-categories/:id', (req, res) => {
  db().prepare('DELETE FROM sub_categories WHERE id=?').run(req.params.id);
  db().prepare('UPDATE links SET sub_category_id=NULL WHERE sub_category_id=?').run(req.params.id);
  broadcast('update');
  res.json({ ok: true });
});

// ── Sub Links ─────────────────────────────────────────────
router.get('/links/:id/sub', (req, res) => {
  res.json(db().prepare('SELECT * FROM sub_links WHERE link_id=? ORDER BY sort_order,id').all(req.params.id));
});

router.post('/links/:id/sub', (req, res) => {
  const { title, url, icon = '', sort_order = 0 } = req.body;
  const r = db().prepare('INSERT INTO sub_links (link_id,title,url,icon,sort_order) VALUES (?,?,?,?,?)').run(req.params.id, title, url, icon, sort_order);
  broadcast('update');
  res.json({ id: r.lastInsertRowid });
});

router.put('/sub/:id', (req, res) => {
  const { title, url, icon = '', sort_order = 0 } = req.body;
  db().prepare('UPDATE sub_links SET title=?,url=?,icon=?,sort_order=? WHERE id=?').run(title, url, icon, sort_order, req.params.id);
  broadcast('update');
  res.json({ ok: true });
});

router.delete('/sub/:id', (req, res) => {
  db().prepare('DELETE FROM sub_links WHERE id=?').run(req.params.id);
  broadcast('update');
  res.json({ ok: true });
});

// ── Ads ───────────────────────────────────────────────────
router.get('/ads', (req, res) => {
  res.json(db().prepare('SELECT * FROM ads ORDER BY sort_order,id').all());
});

router.post('/ads', (req, res) => {
  const { title, url = '', image_url = '', description = '', position = 'top', visible = 1, sort_order = 0, title_color = '', desc_color = '', badge = '', badge_color = '' } = req.body;
  const r = db().prepare('INSERT INTO ads (title,url,image_url,description,position,visible,sort_order,title_color,desc_color,badge,badge_color) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(title, url, image_url, description, position, visible, sort_order, title_color, desc_color, badge, badge_color);
  broadcast('update');
  res.json({ id: r.lastInsertRowid });
});

router.put('/ads/:id', (req, res) => {
  const { title, url, image_url, description = '', position, visible, sort_order, title_color = '', desc_color = '', badge = '', badge_color = '' } = req.body;
  db().prepare('UPDATE ads SET title=?,url=?,image_url=?,description=?,position=?,visible=?,sort_order=?,title_color=?,desc_color=?,badge=?,badge_color=? WHERE id=?').run(title, url, image_url, description, position, visible, sort_order, title_color, desc_color, badge, badge_color, req.params.id);
  broadcast('update');
  res.json({ ok: true });
});

router.delete('/ads/:id', (req, res) => {
  db().prepare('DELETE FROM ads WHERE id=?').run(req.params.id);
  broadcast('update');
  res.json({ ok: true });
});

// ── Notices (跑马灯) ───────────────────────────────────────
router.get('/notices', (req, res) => {
  res.json(db().prepare('SELECT * FROM notices ORDER BY sort_order,id').all());
});
router.post('/notices', (req, res) => {
  const { text, url = '', color = '', visible = 1, sort_order = 0 } = req.body;
  const r = db().prepare('INSERT INTO notices (text,url,color,visible,sort_order) VALUES (?,?,?,?,?)').run(text, url, color, visible, sort_order);
  broadcast('update');
  res.json({ id: r.lastInsertRowid });
});
router.put('/notices/:id', (req, res) => {
  const { text, url = '', color = '', visible, sort_order } = req.body;
  db().prepare('UPDATE notices SET text=?,url=?,color=?,visible=?,sort_order=? WHERE id=?').run(text, url, color, visible, sort_order, req.params.id);
  broadcast('update');
  res.json({ ok: true });
});
router.delete('/notices/:id', (req, res) => {
  db().prepare('DELETE FROM notices WHERE id=?').run(req.params.id);
  broadcast('update');
  res.json({ ok: true });
});

// ── Banners (横幅图片) ─────────────────────────────────────
router.get('/banners', (req, res) => {
  res.json(db().prepare('SELECT * FROM banners ORDER BY sort_order,id').all());
});
router.post('/banners', (req, res) => {
  const { image_url, url = '', visible = 1, sort_order = 0 } = req.body;
  const r = db().prepare('INSERT INTO banners (image_url,url,visible,sort_order) VALUES (?,?,?,?)').run(image_url, url, visible, sort_order);
  broadcast('update');
  res.json({ id: r.lastInsertRowid });
});
router.put('/banners/:id', (req, res) => {
  const { image_url, url = '', visible, sort_order } = req.body;
  db().prepare('UPDATE banners SET image_url=?,url=?,visible=?,sort_order=? WHERE id=?').run(image_url, url, visible, sort_order, req.params.id);
  broadcast('update');
  res.json({ ok: true });
});
router.delete('/banners/:id', (req, res) => {
  db().prepare('DELETE FROM banners WHERE id=?').run(req.params.id);
  broadcast('update');
  res.json({ ok: true });
});

// ── Navs (横向导航) ────────────────────────────────────────
router.get('/navs', (req, res) => {
  res.json(db().prepare('SELECT * FROM navs ORDER BY sort_order,id').all());
});
router.post('/navs', (req, res) => {
  const { title, url = '', icon = '', color = '', content = '', visible = 1, sort_order = 0 } = req.body;
  const r = db().prepare('INSERT INTO navs (title,url,icon,color,content,visible,sort_order) VALUES (?,?,?,?,?,?,?)').run(title, url, icon, color, content, visible, sort_order);
  broadcast('update');
  res.json({ id: r.lastInsertRowid });
});
router.put('/navs/:id', (req, res) => {
  const { title, url = '', icon = '', color = '', content = '', visible, sort_order } = req.body;
  db().prepare('UPDATE navs SET title=?,url=?,icon=?,color=?,content=?,visible=?,sort_order=? WHERE id=?').run(title, url, icon, color, content, visible, sort_order, req.params.id);
  broadcast('update');
  res.json({ ok: true });
});
router.delete('/navs/:id', (req, res) => {
  db().prepare('DELETE FROM navs WHERE id=?').run(req.params.id);
  broadcast('update');
  res.json({ ok: true });
});

module.exports = router;
