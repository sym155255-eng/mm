const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 密钥优先级：环境变量 > data/.jwt_secret 文件（首次自动生成随机值）
function loadSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const file = path.join(__dirname, '../../../data/.jwt_secret');
  try {
    if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8').trim();
    const secret = crypto.randomBytes(48).toString('hex'); // 随机 96 位十六进制
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, secret);
    return secret;
  } catch {
    return crypto.randomBytes(48).toString('hex'); // 兜底：内存随机（重启会失效）
  }
}
const JWT_SECRET = loadSecret();

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

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ error: '需要管理员权限' });
}

module.exports = { authMiddleware, requireAdmin, JWT_SECRET };
