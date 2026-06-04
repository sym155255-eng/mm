const router = require('express').Router();
const { getDB } = require('../db');

router.get('/data', (req, res) => {
  const db = getDB();
  const categories = db.prepare('SELECT * FROM categories WHERE visible=1 ORDER BY sort_order,id').all();
  const links = db.prepare('SELECT * FROM links WHERE visible=1 ORDER BY sort_order,id').all();
  const subLinks = db.prepare('SELECT * FROM sub_links ORDER BY sort_order,id').all();
  const settings = db.prepare('SELECT * FROM settings').all();
  const ads = db.prepare('SELECT * FROM ads WHERE visible=1 ORDER BY sort_order,id').all();

  const settingsObj = {};
  settings.forEach(s => settingsObj[s.key] = s.value);

  // 把子链接挂到对应 link 上
  const subMap = {};
  subLinks.forEach(sl => { if (!subMap[sl.link_id]) subMap[sl.link_id] = []; subMap[sl.link_id].push(sl); });
  const linksWithSub = links.map(l => ({ ...l, sub_links: subMap[l.id] || [] }));

  res.json({ categories, links: linksWithSub, settings: settingsObj, ads });
});

module.exports = router;
