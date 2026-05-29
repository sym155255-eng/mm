CREATE DATABASE IF NOT EXISTS nav_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nav_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  sort INT DEFAULT 0,
  icon VARCHAR(255) DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  url VARCHAR(255) NOT NULL,
  logo VARCHAR(255) DEFAULT '',
  description TEXT,
  category_id INT,
  clicks INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 默认管理员账号: admin / admin123
INSERT INTO users (username, password, email, role) VALUES
('admin', '$2b$10$iGxD/bRXtWuIgs0r2Yl2dO8bXxXuWNAcJNu1Qs3sVGoSSkn/Vxlm2', 'admin@example.com', 'admin');

-- 默认分类
INSERT INTO categories (name, sort, icon) VALUES
('常用工具', 1, '🔧'),
('社交媒体', 2, '💬'),
('新闻资讯', 3, '📰'),
('技术开发', 4, '💻'),
('购物娱乐', 5, '🛒'),
('学习教育', 6, '📚');

-- 示例导航链接
INSERT INTO links (title, url, logo, description, category_id) VALUES
('百度', 'https://www.baidu.com', 'https://www.baidu.com/favicon.ico', '全球最大的中文搜索引擎', 1),
('谷歌', 'https://www.google.com', 'https://www.google.com/favicon.ico', '全球最大的搜索引擎', 1),
('GitHub', 'https://github.com', 'https://github.com/favicon.ico', '全球最大的代码托管平台', 4),
('MDN Web Docs', 'https://developer.mozilla.org', '', 'Mozilla Web 开发技术文档', 4),
('微博', 'https://weibo.com', 'https://weibo.com/favicon.ico', '中国领先的社交媒体平台', 2),
('知乎', 'https://www.zhihu.com', 'https://www.zhihu.com/favicon.ico', '中文互联网高质量问答社区', 2),
('36氪', 'https://36kr.com', 'https://36kr.com/favicon.ico', '互联网创业与科技资讯', 3),
('B站', 'https://www.bilibili.com', 'https://www.bilibili.com/favicon.ico', '国内领先的视频弹幕网站', 5),
('慕课网', 'https://www.imooc.com', 'https://www.imooc.com/favicon.ico', '国内领先的IT技术学习平台', 6),
('掘金', 'https://juejin.cn', 'https://juejin.cn/favicon.ico', '面向全球中文开发者的技术内容分享与交流平台', 4);
