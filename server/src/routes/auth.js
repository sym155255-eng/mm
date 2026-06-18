const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');
const captcha = require('../captcha');

// ── 防暴力破解：按 IP 记录失败次数 ──
const attempts = new Map(); // ip -> { count, lockUntil }
const MAX_FAILS = 5;        // 最多失败次数
const LOCK_MS = 15 * 60 * 1000; // 锁定 15 分钟

function getIP(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
}

router.post('/login', (req, res) => {
  const ip = getIP(req);
  const now = Date.now();
  const rec = attempts.get(ip);

  // 已被锁定
  if (rec && rec.lockUntil && rec.lockUntil > now) {
    const mins = Math.ceil((rec.lockUntil - now) / 60000);
    return res.status(429).json({ error: `失败次数过多，请 ${mins} 分钟后再试` });
  }

  const { username, password, captcha_token, captcha_text } = req.body;
  if (!username || !password) return res.status(400).json({ error: '请填写用户名和密码' });
  if (!captcha.verify(captcha_token, captcha_text)) return res.status(400).json({ error: '验证码错误或已过期' });
  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    // 记一次失败
    const cur = rec && rec.lockUntil > now - LOCK_MS ? rec : { count: 0 };
    cur.count = (cur.count || 0) + 1;
    if (cur.count >= MAX_FAILS) { cur.lockUntil = now + LOCK_MS; cur.count = 0; }
    attempts.set(ip, cur);
    const left = MAX_FAILS - (cur.count || 0);
    return res.status(401).json({ error: `用户名或密码错误${cur.lockUntil ? '，账号已临时锁定 15 分钟' : `，还可尝试 ${left} 次`}` });
  }

  // 成功 → 清除失败记录
  attempts.delete(ip);
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, nickname: user.nickname || '' } });
});

// 注册（普通用户，role=user）
router.post('/register', (req, res) => {
  let { username, password, nickname, captcha_token, captcha_text } = req.body || {};
  username = String(username || '').trim();
  nickname = String(nickname || '').trim().slice(0, 30);
  if (!username || !password) return res.status(400).json({ error: '请填写用户名和密码' });
  if (!captcha.verify(captcha_token, captcha_text)) return res.status(400).json({ error: '验证码错误或已过期' });
  if (username.length < 2 || username.length > 20) return res.status(400).json({ error: '用户名长度需为 2-20 位' });
  if (String(password).length < 6) return res.status(400).json({ error: '密码至少 6 位' });
  const db = getDB();
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.status(400).json({ error: '用户名已被占用' });
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (username, password, role, nickname) VALUES (?, ?, ?, ?)').run(username, hash, 'user', nickname);
  const token = jwt.sign({ id: info.lastInsertRowid, username, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: info.lastInsertRowid, username, role: 'user', nickname } });
});

router.post('/change-password', require('../middleware/auth').authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(oldPassword, user.password)) {
    return res.status(400).json({ error: '原密码错误' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.user.id);
  res.json({ ok: true });
});

module.exports = router;
