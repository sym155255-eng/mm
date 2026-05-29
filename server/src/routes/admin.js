const router = require('express').Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const { adminMiddleware } = require('../middleware/auth');

router.get('/stats', adminMiddleware, (req, res) => {
  try {
    const users = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const categories = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
    const links = db.prepare('SELECT COUNT(*) as c FROM links').get().c;
    const total_clicks = db.prepare('SELECT COALESCE(SUM(clicks),0) as c FROM links').get().c;
    const top_links = db.prepare('SELECT title, url, clicks FROM links ORDER BY clicks DESC LIMIT 10').all();
    res.json({ code: 200, data: { users, categories, links, total_clicks, top_links } });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.get('/users', adminMiddleware, (req, res) => {
  try {
    const rows = db.prepare('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC').all();
    res.json({ code: 200, data: rows });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.put('/users/:id/role', adminMiddleware, (req, res) => {
  const { role } = req.body;
  if (!['admin', 'user'].includes(role))
    return res.status(400).json({ code: 400, message: '无效角色' });
  try {
    db.prepare('UPDATE users SET role=? WHERE id=?').run(role, req.params.id);
    res.json({ code: 200, message: '更新成功' });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.delete('/users/:id', adminMiddleware, (req, res) => {
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ code: 400, message: '不能删除自己' });
  try {
    db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
    res.json({ code: 200, message: '删除成功' });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/reset-admin-password', adminMiddleware, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ code: 400, message: '密码至少6位' });
  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password=? WHERE id=?').run(hashed, req.user.id);
    res.json({ code: 200, message: '密码修改成功' });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
