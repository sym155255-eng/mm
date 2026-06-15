const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// 加载 server/.env（迷你解析，无需依赖）
try {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
      const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        let v = m[2].trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        process.env[m[1]] = v;
      }
    });
  }
} catch {}

const { initDB } = require('./db');
const { sseHandler } = require('./sse');
const { startAutoBackup } = require('./backup');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 本地图标目录
app.use('/icons', express.static(path.join(__dirname, '../../data/icons')));
app.use(express.static(path.join(__dirname, '../../client/dist')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/public', require('./routes/public'));
app.use('/api/admin', require('./routes/admin'));
app.get('/api/events', sseHandler);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n✅ 导航站运行在 http://localhost:${PORT}`);
    console.log(`   管理后台: http://localhost:${PORT}/admin`);
    console.log(`   账号: admin  密码: admin123\n`);
    startAutoBackup();
  });
}).catch(err => {
  console.error('数据库初始化失败:', err);
  process.exit(1);
});
