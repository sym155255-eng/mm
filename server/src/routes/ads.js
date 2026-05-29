const router = require('express').Router();
const db = require('../db');
const { adminMiddleware } = require('../middleware/auth');

// 公开：获取已启用的广告
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT * FROM ads WHERE enabled = 1 ORDER BY sort ASC, id ASC`
    ).all();
    res.json({ code: 200, data: rows });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 管理：获取所有广告（含禁用）
router.get('/all', adminMiddleware, (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ads ORDER BY sort ASC, id ASC`).all();
    res.json({ code: 200, data: rows });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 新增
router.post('/', adminMiddleware, (req, res) => {
  const { title, description = '', badge = '', badge_color = '#6366f1', link = '', columns = 1, bg_color = '', sort = 0, enabled = 1, title_color = '', desc_color = '' } = req.body;
  if (!title) return res.status(400).json({ code: 400, message: '标题不能为空' });
  try {
    const result = db.prepare(
      `INSERT INTO ads (title, description, badge, badge_color, link, columns, bg_color, sort, enabled, title_color, desc_color) VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    ).run(title, description, badge, badge_color, link, columns, bg_color, sort, enabled ? 1 : 0, title_color, desc_color);
    res.json({ code: 200, message: '添加成功', id: result.lastInsertRowid });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 编辑
router.put('/:id', adminMiddleware, (req, res) => {
  const { title, description = '', badge = '', badge_color = '#6366f1', link = '', columns = 1, bg_color = '', sort = 0, enabled = 1, title_color = '', desc_color = '' } = req.body;
  try {
    db.prepare(
      `UPDATE ads SET title=?,description=?,badge=?,badge_color=?,link=?,columns=?,bg_color=?,sort=?,enabled=?,title_color=?,desc_color=? WHERE id=?`
    ).run(title, description, badge, badge_color, link, columns, bg_color, sort, enabled ? 1 : 0, title_color, desc_color, req.params.id);
    res.json({ code: 200, message: '更新成功' });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 删除
router.delete('/:id', adminMiddleware, (req, res) => {
  try {
    db.prepare(`DELETE FROM ads WHERE id=?`).run(req.params.id);
    res.json({ code: 200, message: '删除成功' });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
