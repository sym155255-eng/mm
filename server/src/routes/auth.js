const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) return res.status(401).json({ code: 401, message: '用户名或密码错误' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ code: 401, message: '用户名或密码错误' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ code: 200, token, user: { id: user.id, username: user.username, role: user.role } });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password)
    return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
  try {
    const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (exists) return res.status(409).json({ code: 409, message: '用户名已存在' });

    const hashed = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users (username, password, email, role) VALUES (?,?,?,?)').run(username, hashed, email || null, 'user');
    res.json({ code: 200, message: '注册成功' });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
