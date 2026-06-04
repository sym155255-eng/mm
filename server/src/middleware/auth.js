const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'nav_secret_2025';

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token无效' });
  }
}

module.exports = { authMiddleware, JWT_SECRET };
