const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, '../../nav.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sort INTEGER DEFAULT 0,
    icon TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    logo TEXT DEFAULT '',
    description TEXT,
    category_id INTEGER,
    clicks INTEGER DEFAULT 0,
    badge TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );
`);

// 子链接表
db.exec(`
  CREATE TABLE IF NOT EXISTS link_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id INTEGER NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL DEFAULT '',
    sort INTEGER DEFAULT 0,
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
  );
`);

// 广告栏表
db.exec(`
  CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    badge TEXT DEFAULT '',
    badge_color TEXT DEFAULT '#6366f1',
    link TEXT DEFAULT '',
    columns INTEGER DEFAULT 1,
    bg_color TEXT DEFAULT '',
    sort INTEGER DEFAULT 0,
    enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// 索引（已存在时 IF NOT EXISTS 跳过）
try {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_links_category ON links(category_id);
    CREATE INDEX IF NOT EXISTS idx_links_clicks   ON links(clicks DESC);
    CREATE INDEX IF NOT EXISTS idx_links_title    ON links(title);
    CREATE INDEX IF NOT EXISTS idx_ads_sort       ON ads(sort, id);
    CREATE INDEX IF NOT EXISTS idx_ads_enabled    ON ads(enabled);
  `);
} catch {}

// 兼容旧数据库：补充新列
try { db.exec("ALTER TABLE links ADD COLUMN badge TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE links ADD COLUMN title_color TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE links ADD COLUMN desc_color TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE ads ADD COLUMN title_color TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE ads ADD COLUMN desc_color TEXT DEFAULT ''"); } catch {}

// 写入默认网站设置（INSERT OR IGNORE 保证已有值不被覆盖）
const setSetting = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
db.transaction(() => {
  setSetting.run('site_name', '导航站');
  setSetting.run('site_icon', '🧭');
  setSetting.run('site_desc', '收录优质网站');
  setSetting.run('site_footer', '© 导航站 · 收录优质网站');
  setSetting.run('marquee_enabled', 'false');
  setSetting.run('marquee_text', '🎉 欢迎使用导航站，发现更多优质网站！ ✨ 每天更新精选内容 🚀 快来探索吧！');
  setSetting.run('marquee_gradient', 'rainbow');
  setSetting.run('marquee_speed', '30');
})();

// 首次运行时写入种子数据
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (userCount === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare("INSERT INTO users (username, password, email, role) VALUES (?,?,?,?)").run('admin', hash, 'admin@example.com', 'admin');

  const insertCat = db.prepare('INSERT INTO categories (name, sort, icon) VALUES (?,?,?)');
  const cats = db.transaction(() => {
    const ids = [];
    for (const [name, sort, icon] of [
      ['常用工具',1,'🔧'],['社交媒体',2,'💬'],['新闻资讯',3,'📰'],
      ['技术开发',4,'💻'],['购物娱乐',5,'🛒'],['学习教育',6,'📚'],
    ]) ids.push(insertCat.run(name, sort, icon).lastInsertRowid);
    return ids;
  });
  const catIds = cats();

  const insertLink = db.prepare('INSERT INTO links (title,url,logo,description,category_id) VALUES (?,?,?,?,?)');
  db.transaction(() => {
    const seeds = [
      ['百度','https://www.baidu.com','https://www.baidu.com/favicon.ico','全球最大的中文搜索引擎',catIds[0]],
      ['谷歌','https://www.google.com','https://www.google.com/favicon.ico','全球最大的搜索引擎',catIds[0]],
      ['GitHub','https://github.com','https://github.com/favicon.ico','全球最大的代码托管平台',catIds[3]],
      ['MDN Web Docs','https://developer.mozilla.org','','Mozilla Web 开发技术文档',catIds[3]],
      ['微博','https://weibo.com','https://weibo.com/favicon.ico','中国领先的社交媒体平台',catIds[1]],
      ['知乎','https://www.zhihu.com','https://www.zhihu.com/favicon.ico','中文互联网高质量问答社区',catIds[1]],
      ['36氪','https://36kr.com','https://36kr.com/favicon.ico','互联网创业与科技资讯',catIds[2]],
      ['B站','https://www.bilibili.com','https://www.bilibili.com/favicon.ico','国内领先的视频弹幕网站',catIds[4]],
      ['慕课网','https://www.imooc.com','https://www.imooc.com/favicon.ico','国内领先的IT技术学习平台',catIds[5]],
      ['掘金','https://juejin.cn','https://juejin.cn/favicon.ico','面向全球中文开发者的技术内容分享与交流平台',catIds[3]],
    ];
    for (const row of seeds) insertLink.run(...row);
  })();
}

module.exports = db;
