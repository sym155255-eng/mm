const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');
const { sseHandler } = require('./sse');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  });
}).catch(err => {
  console.error('数据库初始化失败:', err);
  process.exit(1);
});
