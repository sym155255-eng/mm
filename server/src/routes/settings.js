const router = require('express').Router();
const db = require('../db');
const { adminMiddleware } = require('../middleware/auth');

// GET /api/settings  —— 公开，前台读取
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const data = Object.fromEntries(rows.map(r => [r.key, r.value]));
    res.json({ code: 200, data });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// PUT /api/admin/settings  —— 管理员批量保存
router.put('/', adminMiddleware, (req, res) => {
  const allowed = ['site_name', 'site_icon', 'site_desc', 'site_footer',
    'marquee_enabled', 'marquee_text', 'marquee_gradient', 'marquee_speed', 'marquee_style',
    'site_layout'];
  try {
    const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
    db.transaction(() => {
      for (const key of allowed) {
        if (req.body[key] !== undefined) upsert.run(key, String(req.body[key]));
      }
    })();
    res.json({ code: 200, message: '保存成功' });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
