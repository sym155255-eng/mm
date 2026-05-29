const router = require('express').Router();
const db = require('../db');
const { adminMiddleware } = require('../middleware/auth');

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM categories ORDER BY sort ASC, id ASC').all();
    res.json({ code: 200, data: rows });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/', adminMiddleware, (req, res) => {
  const { name, sort = 0, icon = '' } = req.body;
  if (!name) return res.status(400).json({ code: 400, message: '分类名称不能为空' });
  try {
    const result = db.prepare('INSERT INTO categories (name, sort, icon) VALUES (?,?,?)').run(name, sort, icon);
    res.json({ code: 200, message: '添加成功', id: result.lastInsertRowid });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.put('/:id', adminMiddleware, (req, res) => {
  const { name, sort, icon } = req.body;
  try {
    db.prepare('UPDATE categories SET name=?, sort=?, icon=? WHERE id=?').run(name, sort, icon, req.params.id);
    res.json({ code: 200, message: '更新成功' });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.delete('/:id', adminMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM categories WHERE id=?').run(req.params.id);
    res.json({ code: 200, message: '删除成功' });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
