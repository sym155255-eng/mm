require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const linkRoutes = require('./routes/links');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settings');
const adsRoutes = require('./routes/ads');
const linkItemsRoutes = require('./routes/linkItems');

const app = express();

// 安全响应头
app.use(helmet({ contentSecurityPolicy: false }));

// 压缩响应体
app.use(compression());

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// 限流：全局 1000次/15分钟，登录接口收紧
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true, legacyHeaders: false });
const authLimiter  = rateLimit({ windowMs: 15 * 60 * 1000, max: 20,  message: { code: 429, message: '请求过于频繁，请稍后再试' } });
app.use(globalLimiter);
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);

// 公开接口 — 静态资源加缓存头
const cacheMiddleware = (sec) => (_, res, next) => {
  res.set('Cache-Control', `public, max-age=${sec}`);
  next();
};

app.use('/api', authRoutes);
app.use('/api/categories', cacheMiddleware(60), categoryRoutes);
app.use('/api/links', cacheMiddleware(30), linkRoutes);
app.use('/api/settings', cacheMiddleware(60), settingsRoutes);
app.use('/api/ads', cacheMiddleware(30), adsRoutes);

// 管理员接口（路由内部鉴权）
app.use('/api/admin', adminRoutes);
app.use('/api/admin/categories', categoryRoutes);
app.use('/api/admin/links', linkRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/ads', adsRoutes);
app.use('/api/admin/link-items', linkItemsRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: Date.now() }));

// 托管前端打包文件（生产环境）
const distPath = path.join(__dirname, '../../client/dist');
app.use(express.static(distPath, { maxAge: '7d', etag: true }));
// SPA 回退：所有非 API 路由返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// 全局错误处理
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
