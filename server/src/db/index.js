const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../../../data/nav.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const SAVE_DEBOUNCE_MS = 800; // 写盘防抖间隔

let db;

// Wrapper that mimics better-sqlite3 sync API on top of sql.js (which is sync too)
class DB {
  constructor(sqljs) {
    if (fs.existsSync(DB_PATH)) {
      const buf = fs.readFileSync(DB_PATH);
      this._db = new sqljs.Database(buf);
    } else {
      this._db = new sqljs.Database();
    }
  }

  // 立即全量落盘
  _saveNow() {
    if (this._saveTimer) { clearTimeout(this._saveTimer); this._saveTimer = null; }
    this._dirty = false;
    const data = this._db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }

  // 防抖落盘：内存里数据已即时更新（读立即可见），磁盘最多每 SAVE_DEBOUNCE_MS 写一次。
  // 采用「首次脏写后固定延时刷一次」而非每次重置，避免持续写入时被无限推迟（不会饿死）。
  _save() {
    this._dirty = true;
    if (this._saveTimer) return;
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      if (this._dirty) this._saveNow();
    }, SAVE_DEBOUNCE_MS);
  }

  exec(sql) {
    this._db.run(sql);
    this._save();
    return this;
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        self._db.run(sql, params);
        // 必须在 _save() (export) 之前查询，否则 rowid 可能被重置
        let lastId = 0;
        try { lastId = self._db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0] || 0; } catch {}
        self._save();
        return { lastInsertRowid: lastId };
      },
      get(...params) {
        const res = self._db.exec(sql, params);
        if (!res.length || !res[0].values.length) return undefined;
        const cols = res[0].columns;
        const row = res[0].values[0];
        return Object.fromEntries(cols.map((c, i) => [c, row[i]]));
      },
      all(...params) {
        const res = self._db.exec(sql, params);
        if (!res.length) return [];
        const cols = res[0].columns;
        return res[0].values.map(row => Object.fromEntries(cols.map((c, i) => [c, row[i]])));
      },
    };
  }

  transaction(fn) {
    return (arg) => {
      this._db.run('BEGIN');
      try {
        fn(arg);
        this._db.run('COMMIT');
        this._save();
      } catch (e) {
        this._db.run('ROLLBACK');
        throw e;
      }
    };
  }

  pragma() { return this; }
}

async function initDB() {
  const SQL = await initSqlJs();
  db = new DB(SQL);

  db._db.run(`PRAGMA foreign_keys = ON`);

  db._db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db._db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '🔗',
      sort_order INTEGER DEFAULT 0,
      visible INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db._db.run(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      icon TEXT DEFAULT '',
      description TEXT DEFAULT '',
      title_color TEXT DEFAULT '',
      desc_color TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      visible INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db._db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);
  db._db.run(`
    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      position TEXT DEFAULT 'top',
      visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db._db.run(`
    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db._save();
  db._db.run(`
    CREATE TABLE IF NOT EXISTS navs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT DEFAULT '',
      icon TEXT DEFAULT '',
      color TEXT DEFAULT '',
      visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0
    )
  `);
  db._save();
  db._db.run(`
    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT NOT NULL,
      url TEXT DEFAULT '',
      visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db._save();
  db._db.run(`
    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      url TEXT DEFAULT '',
      color TEXT DEFAULT '',
      visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db._save();

  // Migrations: add new columns if not exist
  try { db._db.run(`ALTER TABLE links ADD COLUMN title_color TEXT DEFAULT ''`); db._save(); } catch {}
  try { db._db.run(`ALTER TABLE links ADD COLUMN desc_color TEXT DEFAULT ''`); db._save(); } catch {}
  try { db._db.run(`ALTER TABLE ads ADD COLUMN description TEXT DEFAULT ''`); db._save(); } catch {}
  try { db._db.run(`ALTER TABLE ads ADD COLUMN title_color TEXT DEFAULT ''`); db._save(); } catch {}
  try { db._db.run(`ALTER TABLE ads ADD COLUMN desc_color TEXT DEFAULT ''`); db._save(); } catch {}
  db._db.run(`
    CREATE TABLE IF NOT EXISTS sub_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    )
  `);
  db._save();
  try { db._db.run(`ALTER TABLE links ADD COLUMN sub_category_id INTEGER`); db._save(); } catch {}
  db._db.run(`
    CREATE TABLE IF NOT EXISTS sub_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      icon TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    )
  `);
  db._save();
  try { db._db.run(`ALTER TABLE navs ADD COLUMN content TEXT DEFAULT ''`); db._save(); } catch {}
  db._db.run(`
    CREATE TABLE IF NOT EXISTS ad_sub_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      icon TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    )
  `);
  db._save();
  try { db._db.run(`ALTER TABLE categories ADD COLUMN page_group TEXT DEFAULT 'home'`); db._save(); } catch {}
  try { db._db.run(`ALTER TABLE links ADD COLUMN views INTEGER DEFAULT 0`); db._save(); } catch {}
  try { db._db.run(`ALTER TABLE links ADD COLUMN badge TEXT DEFAULT ''`); db._save(); } catch {}
  try { db._db.run(`ALTER TABLE links ADD COLUMN badge_color TEXT DEFAULT ''`); db._save(); } catch {}
  try { db._db.run(`ALTER TABLE ads ADD COLUMN badge TEXT DEFAULT ''`); db._save(); } catch {}
  try { db._db.run(`ALTER TABLE ads ADD COLUMN badge_color TEXT DEFAULT ''`); db._save(); } catch {}
  // 描述渐变色（CSS linear-gradient 字符串），用于卡片描述/广告描述
  try { db._db.run(`ALTER TABLE links ADD COLUMN desc_gradient TEXT DEFAULT ''`); db._save(); } catch {}
  try { db._db.run(`ALTER TABLE ads ADD COLUMN desc_gradient TEXT DEFAULT ''`); db._save(); } catch {}

  // 访客统计（按天聚合：PV 浏览量 / UV 独立访客）
  db._db.run(`
    CREATE TABLE IF NOT EXISTS stats_daily (
      date TEXT PRIMARY KEY,
      pv INTEGER DEFAULT 0,
      uv INTEGER DEFAULT 0
    )
  `);
  db._db.run(`
    CREATE TABLE IF NOT EXISTS visit_ips (
      date TEXT NOT NULL,
      ip TEXT NOT NULL,
      PRIMARY KEY (date, ip)
    )
  `);
  db._save();

  // 用户投稿（待审核的卡片链接）
  db._db.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      nickname TEXT DEFAULT '',
      category_id INTEGER,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db._save();

  // 评论
  db._db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      link_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      nickname TEXT DEFAULT '匿名',
      email TEXT DEFAULT '',
      visible INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db._save();
  // 用户昵称 + 评论关联用户
  try { db._db.run(`ALTER TABLE users ADD COLUMN nickname TEXT DEFAULT ''`); db._save(); } catch {}
  try { db._db.run(`ALTER TABLE users ADD COLUMN nickname_color TEXT DEFAULT ''`); db._save(); } catch {}
  try { db._db.run(`ALTER TABLE users ADD COLUMN role_color TEXT DEFAULT ''`); db._save(); } catch {}
  try { db._db.run(`ALTER TABLE comments ADD COLUMN user_id INTEGER`); db._save(); } catch {}
  try { db._db.run(`ALTER TABLE comments ADD COLUMN image_url TEXT DEFAULT ''`); db._save(); } catch {}

  // Seed default data
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
  }

  const settingsCount = db.prepare('SELECT COUNT(*) as c FROM settings').get();
  if (!settingsCount || settingsCount.c === 0) {
    const defaults = [
      ['site_title', '我的导航'],
      ['site_subtitle', '收录优质网站，发现精彩内容'],
      ['site_logo', '🧭'],
      ['bg_color', '#f0f4ff'],
      ['primary_color', '#4f6ef7'],
      ['search_placeholder', '搜索网站...'],
      ['footer_text', '© 2025 我的导航'],
      ['show_ads', '1'],
      ['show_search', '1'],
    ];
    defaults.forEach(([k, v]) => db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(k, v));
  }

  const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get();
  if (!catCount || catCount.c === 0) {
    const cats = [
      { name: '常用工具', icon: '🛠️' },
      { name: '搜索引擎', icon: '🔍' },
      { name: '社交媒体', icon: '💬' },
      { name: '学习资源', icon: '📚' },
      { name: '影音娱乐', icon: '🎬' },
    ];
    cats.forEach((c, i) => db.prepare('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)').run(c.name, c.icon, i));

    const linkData = [
      [1, 'GitHub', 'https://github.com', '', '全球最大代码托管平台'],
      [1, 'VSCode', 'https://code.visualstudio.com', '', '微软开源代码编辑器'],
      [2, '百度', 'https://www.baidu.com', '', '国内最大搜索引擎'],
      [2, 'Google', 'https://www.google.com', '', '全球最大搜索引擎'],
      [2, 'Bing', 'https://www.bing.com', '', '微软搜索引擎'],
      [3, 'X (Twitter)', 'https://twitter.com', '', '全球实时信息平台'],
      [3, 'Discord', 'https://discord.com', '', '游戏社区聊天平台'],
      [4, 'MDN', 'https://developer.mozilla.org', '', '前端开发者文档'],
      [4, 'Stack Overflow', 'https://stackoverflow.com', '', '程序员问答社区'],
      [5, 'YouTube', 'https://youtube.com', '', '全球最大视频平台'],
      [5, 'Bilibili', 'https://bilibili.com', '', '国内弹幕视频网站'],
    ];
    linkData.forEach((l, i) => db.prepare('INSERT INTO links (category_id, title, url, icon, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)').run(...l, i));
  }

  db._saveNow(); // 启动期的迁移/初始化数据立即落盘

  // 进程退出前刷盘，避免防抖窗口内的写丢失
  let flushed = false;
  const flush = () => { if (flushed) return; flushed = true; try { if (db._dirty) db._saveNow(); } catch {} };
  process.on('SIGINT',  () => { flush(); process.exit(0); });
  process.on('SIGTERM', () => { flush(); process.exit(0); });
  process.on('beforeExit', flush);

  console.log('✅ 数据库初始化完成');
  return db;
}

function getDB() {
  if (!db) throw new Error('DB not initialized');
  return db;
}

module.exports = { initDB, getDB };
