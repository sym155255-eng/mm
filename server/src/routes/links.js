const router = require('express').Router();
const db = require('../db');
const { adminMiddleware } = require('../middleware/auth');

router.get('/', (req, res) => {
  const { page = 1, size = 20, keyword = '', category = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(size);
  const params = [];
  let where = 'WHERE 1=1';

  if (keyword) {
    where += ' AND (l.title LIKE ? OR l.description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (category) {
    where += ' AND l.category_id = ?';
    params.push(parseInt(category));
  }

  try {
    const total = db.prepare(`SELECT COUNT(*) as c FROM links l ${where}`).get(...params).c;
    const rows = db.prepare(
      `SELECT l.*, c.name as category_name, c.icon as category_icon
       FROM links l LEFT JOIN categories c ON l.category_id = c.id
       ${where} ORDER BY l.clicks DESC, l.id DESC LIMIT ? OFFSET ?`
    ).all(...params, parseInt(size), offset);
    res.json({ code: 200, data: rows, total, page: parseInt(page), size: parseInt(size) });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.get('/grouped', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY sort ASC, id ASC').all();
    const links = db.prepare(
      `SELECT l.*, c.name as category_name FROM links l
       LEFT JOIN categories c ON l.category_id = c.id ORDER BY l.clicks DESC, l.id ASC`
    ).all();
    const allItems = db.prepare('SELECT * FROM link_items ORDER BY sort ASC, id ASC').all();
    const itemsMap = {};
    allItems.forEach(item => {
      if (!itemsMap[item.link_id]) itemsMap[item.link_id] = [];
      itemsMap[item.link_id].push(item);
    });
    const linksWithItems = links.map(l => ({ ...l, items: itemsMap[l.id] || [] }));
    const grouped = categories.map(cat => ({
      ...cat,
      links: linksWithItems.filter(l => l.category_id === cat.id),
    }));
    res.json({ code: 200, data: grouped });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/:id/click', (req, res) => {
  try {
    db.prepare('UPDATE links SET clicks = clicks + 1 WHERE id = ?').run(req.params.id);
    res.json({ code: 200 });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.post('/', adminMiddleware, (req, res) => {
  const title = (req.body.title || '').trim();
  const url   = (req.body.url   || '').trim();
  const logo        = (req.body.logo        || '').trim();
  const description = (req.body.description || '').trim();
  const badge       = (req.body.badge       || '').trim();
  const title_color = (req.body.title_color || '').trim();
  const desc_color  = (req.body.desc_color  || '').trim();
  const { category_id } = req.body;
  if (!title || !url) return res.status(400).json({ code: 400, message: '名称和地址不能为空' });
  if (!/^https?:\/\/.+/.test(url)) return res.status(400).json({ code: 400, message: '地址格式不正确，需以 http/https 开头' });
  try {
    const result = db.prepare(
      'INSERT INTO links (title, url, logo, description, category_id, badge, title_color, desc_color) VALUES (?,?,?,?,?,?,?,?)'
    ).run(title, url, logo, description, category_id || null, badge, title_color, desc_color);
    res.json({ code: 200, message: '添加成功', id: result.lastInsertRowid });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.put('/:id', adminMiddleware, (req, res) => {
  const { title, url, logo, description, category_id, badge = '', title_color = '', desc_color = '' } = req.body;
  try {
    db.prepare('UPDATE links SET title=?,url=?,logo=?,description=?,category_id=?,badge=?,title_color=?,desc_color=? WHERE id=?')
      .run(title, url, logo, description, category_id || null, badge, title_color, desc_color, req.params.id);
    res.json({ code: 200, message: '更新成功' });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

router.delete('/:id', adminMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM links WHERE id=?').run(req.params.id);
    res.json({ code: 200, message: '删除成功' });
  } catch {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
