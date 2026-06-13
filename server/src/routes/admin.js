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

// 从网址抓取图标（站点 favicon / 高清图标），存本地返回路径
router.post('/fetch-icon', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: '请提供网址' });
  try {
    const p = await fetchFavicon(url);
    if (p) return res.json({ ok: true, path: p });
    res.status(404).json({ error: '没抓到图标，可手动上传' });
  } catch (e) {
    res.status(500).json({ error: '抓取失败：' + e.message });
  }
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

// ── Pages (独立页面) ───────────────────────────────────────
router.get('/pages', (req, res) => {
  res.json(db().prepare('SELECT * FROM pages ORDER BY sort_order,id').all());
});
router.post('/pages', (req, res) => {
  const { title, content = '', visible = 1, sort_order = 0 } = req.body;
  const r = db().prepare('INSERT INTO pages (title,content,visible,sort_order) VALUES (?,?,?,?)').run(title, content, visible, sort_order);
  broadcast('update');
  res.json({ id: r.lastInsertRowid });
});
router.put('/pages/:id', (req, res) => {
  const { title, content = '', visible, sort_order } = req.body;
  db().prepare('UPDATE pages SET title=?,content=?,visible=?,sort_order=? WHERE id=?').run(title, content, visible, sort_order, req.params.id);
  broadcast('update');
  res.json({ ok: true });
});
router.delete('/pages/:id', (req, res) => {
  db().prepare('DELETE FROM pages WHERE id=?').run(req.params.id);
  broadcast('update');
  res.json({ ok: true });
});

// ── 第二页：分区(p2_sections) ──────────────────────────────
router.get('/p2/sections', (req, res) => {
  res.json(db().prepare('SELECT * FROM p2_sections ORDER BY sort_order,id').all());
});
router.post('/p2/sections', (req, res) => {
  const { title, color = '#2a6fb0', sort_order = 0, visible = 1 } = req.body;
  const r = db().prepare('INSERT INTO p2_sections (title,color,sort_order,visible) VALUES (?,?,?,?)').run(title, color, sort_order, visible);
  broadcast('update');
  res.json({ id: r.lastInsertRowid });
});
router.put('/p2/sections/:id', (req, res) => {
  const { title, color = '#2a6fb0', sort_order = 0, visible = 1 } = req.body;
  db().prepare('UPDATE p2_sections SET title=?,color=?,sort_order=?,visible=? WHERE id=?').run(title, color, sort_order, visible, req.params.id);
  broadcast('update');
  res.json({ ok: true });
});
router.delete('/p2/sections/:id', (req, res) => {
  db().prepare('DELETE FROM p2_sections WHERE id=?').run(req.params.id);
  db().prepare('DELETE FROM p2_boards WHERE section_id=?').run(req.params.id);
  broadcast('update');
  res.json({ ok: true });
});

// ── 第二页：子版块(p2_boards) ──────────────────────────────
router.get('/p2/boards', (req, res) => {
  res.json(db().prepare('SELECT * FROM p2_boards ORDER BY sort_order,id').all());
});
router.post('/p2/boards', (req, res) => {
  const { section_id, title, icon = '', badge = '', threads = '', posts = '', last_post = '', url = '', title_color = '', sort_order = 0, visible = 1 } = req.body;
  const r = db().prepare('INSERT INTO p2_boards (section_id,title,icon,badge,threads,posts,last_post,url,title_color,sort_order,visible) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(section_id, title, icon, badge, threads, posts, last_post, url, title_color, sort_order, visible);
  broadcast('update');
  res.json({ id: r.lastInsertRowid });
});
router.put('/p2/boards/:id', (req, res) => {
  const { section_id, title, icon = '', badge = '', threads = '', posts = '', last_post = '', url = '', title_color = '', sort_order = 0, visible = 1 } = req.body;
  db().prepare('UPDATE p2_boards SET section_id=?,title=?,icon=?,badge=?,threads=?,posts=?,last_post=?,url=?,title_color=?,sort_order=?,visible=? WHERE id=?').run(section_id, title, icon, badge, threads, posts, last_post, url, title_color, sort_order, visible, req.params.id);
  broadcast('update');
  res.json({ ok: true });
});
router.delete('/p2/boards/:id', (req, res) => {
  db().prepare('DELETE FROM p2_boards WHERE id=?').run(req.params.id);
  broadcast('update');
  res.json({ ok: true });
});

// ── 第二页：帖子(p2_posts) ─────────────────────────────────
const POST_COLS = 'section_id,board_id,avatar,title,tag,tag_color,category,author,author_vip,post_time,last_user,last_time,comments,url,content,title_color,sort_order,visible';
function postVals(b) {
  // 选了子版块时，所属分区自动取该版块的分区
  let sectionId = b.section_id;
  if (b.board_id) {
    const board = db().prepare('SELECT section_id FROM p2_boards WHERE id=?').get(b.board_id);
    if (board) sectionId = board.section_id;
  }
  return [sectionId, b.board_id || null, b.avatar || '', b.title, b.tag || '', b.tag_color || '#ff7a45', b.category || '', b.author || '',
    b.author_vip ? 1 : 0, b.post_time || '', b.last_user || '', b.last_time || '', b.comments || '', b.url || '', b.content || '', b.title_color || '', b.sort_order || 0, b.visible == null ? 1 : b.visible];
}
router.get('/p2/posts', (req, res) => {
  res.json(db().prepare('SELECT * FROM p2_posts ORDER BY sort_order,id').all());
});
router.post('/p2/posts', (req, res) => {
  const r = db().prepare(`INSERT INTO p2_posts (${POST_COLS}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(...postVals(req.body));
  broadcast('update');
  res.json({ id: r.lastInsertRowid });
});
router.put('/p2/posts/:id', (req, res) => {
  const b = req.body;
  db().prepare(`UPDATE p2_posts SET section_id=?,board_id=?,avatar=?,title=?,tag=?,tag_color=?,category=?,author=?,author_vip=?,post_time=?,last_user=?,last_time=?,comments=?,url=?,content=?,title_color=?,sort_order=?,visible=? WHERE id=?`)
    .run(...postVals(b), req.params.id);
  broadcast('update');
  res.json({ ok: true });
});
router.delete('/p2/posts/:id', (req, res) => {
  db().prepare('DELETE FROM p2_posts WHERE id=?').run(req.params.id);
  broadcast('update');
  res.json({ ok: true });
});

module.exports = router;
