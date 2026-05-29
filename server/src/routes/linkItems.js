const router = require('express').Router();
const db = require('../db');
const { adminMiddleware } = require('../middleware/auth');

// 新增子链接
router.post('/', adminMiddleware, (req, res) => {
  const { link_id, title, url, sort = 0 } = req.body;
  if (!link_id || !title || !url) return res.status(400).json({ code: 400, message: '缺少必要字段' });
  try {
    const result = db.prepare(
      'INSERT INTO link_items (link_id, title, url, sort) VALUES (?,?,?,?)'
    ).run(link_id, title.trim(), url.trim(), sort);
    res.json({ code: 200, message: '添加成功', id: result.lastInsertRowid });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 更新子链接
router.put('/:id', adminMiddleware, (req, res) => {
  const { title, url, sort = 0 } = req.body;
  try {
    db.prepare('UPDATE link_items SET title=?,url=?,sort=? WHERE id=?')
      .run(title.trim(), url.trim(), sort, req.params.id);
    res.json({ code: 200, message: '更新成功' });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 删除子链接
router.delete('/:id', adminMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM link_items WHERE id=?').run(req.params.id);
    res.json({ code: 200, message: '删除成功' });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取某 link 的所有子链接（管理端用）
router.get('/by-link/:linkId', adminMiddleware, (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM link_items WHERE link_id=? ORDER BY sort ASC, id ASC')
      .all(req.params.linkId);
    res.json({ code: 200, data: items });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
