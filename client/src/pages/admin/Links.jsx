import { useEffect, useState } from 'react';
import { linksApi, categoriesApi, linkItemsApi } from '../../api';

const emptyForm = { title: '', url: '', logo: '', description: '', category_id: '', badge: '', title_color: '', desc_color: '' };

const BADGE_PRESETS = [
  { label: '推荐', color: '#ef4444' },
  { label: '热门', color: '#f97316' },
  { label: '新上线', color: '#8b5cf6' },
  { label: '必备', color: '#0ea5e9' },
  { label: '精选', color: '#22c55e' },
  { label: '限时', color: '#ec4899' },
];

// 子链接管理组件
function LinkItemsEditor({ linkId }) {
  const [items, setItems] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', url: '' });
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState({ title: '', url: '' });

  useEffect(() => {
    if (linkId) linkItemsApi.getByLink(linkId).then(r => setItems(r.data || []));
  }, [linkId]);

  const handleAdd = async () => {
    if (!newItem.title.trim() || !newItem.url.trim()) return;
    const res = await linkItemsApi.create({ link_id: linkId, ...newItem, sort: items.length });
    setItems(prev => [...prev, { id: res.id, link_id: linkId, ...newItem, sort: items.length }]);
    setNewItem({ title: '', url: '' });
    setAdding(false);
  };

  const handleDelete = async id => {
    await linkItemsApi.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const startEdit = item => { setEditingId(item.id); setEditVal({ title: item.title, url: item.url }); };
  const handleUpdate = async id => {
    await linkItemsApi.update(id, { ...editVal, sort: items.find(i => i.id === id)?.sort || 0 });
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...editVal } : i));
    setEditingId(null);
  };

  return (
    <div className="link-items-editor">
      <div className="link-items-header">
        <span className="label">子链接 <span className="label-hint">（点击卡片时展开选择）</span></span>
        <button type="button" className="btn-sm btn-edit" onClick={() => setAdding(true)}>+ 添加</button>
      </div>
      {items.length === 0 && !adding && <div className="link-items-empty">暂无子链接，点击「添加」新增</div>}
      <ul className="link-items-list">
        {items.map(item => (
          <li key={item.id} className="link-item-row">
            {editingId === item.id ? (
              <>
                <input className="form-input" value={editVal.title} onChange={e => setEditVal(v => ({ ...v, title: e.target.value }))} placeholder="名称" style={{ flex: 1 }} />
                <input className="form-input" value={editVal.url} onChange={e => setEditVal(v => ({ ...v, url: e.target.value }))} placeholder="链接" style={{ flex: 2 }} />
                <button type="button" className="btn-sm btn-primary" onClick={() => handleUpdate(item.id)}>✓</button>
                <button type="button" className="btn-sm btn-ghost" onClick={() => setEditingId(null)}>✕</button>
              </>
            ) : (
              <>
                <span className="link-item-title">{item.title}</span>
                <span className="link-item-url">{item.url}</span>
                <button type="button" className="btn-sm btn-edit" onClick={() => startEdit(item)}>编辑</button>
                <button type="button" className="btn-sm btn-delete" onClick={() => handleDelete(item.id)}>删除</button>
              </>
            )}
          </li>
        ))}
        {adding && (
          <li className="link-item-row link-item-adding">
            <input className="form-input" value={newItem.title} onChange={e => setNewItem(v => ({ ...v, title: e.target.value }))} placeholder="名称（如：官网）" style={{ flex: 1 }} />
            <input className="form-input" value={newItem.url} onChange={e => setNewItem(v => ({ ...v, url: e.target.value }))} placeholder="https://" style={{ flex: 2 }} />
            <button type="button" className="btn-sm btn-primary" onClick={handleAdd}>确认</button>
            <button type="button" className="btn-sm btn-ghost" onClick={() => setAdding(false)}>取消</button>
          </li>
        )}
      </ul>
    </div>
  );
}

export default function AdminLinks() {
  const [links, setLinks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const size = 15;

  const load = (p = page, kw = keyword) => {
    setLoading(true);
    linksApi.getList({ page: p, size, keyword: kw })
      .then(res => { setLinks(res.data); setTotal(res.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    categoriesApi.getAll().then(res => setCategories(res.data));
    load();
  }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = link => {
    setForm({ title: link.title, url: link.url, logo: link.logo || '', description: link.description || '', category_id: link.category_id || '', badge: link.badge || '', title_color: link.title_color || '', desc_color: link.desc_color || '' });
    setEditId(link.id);
    setShowModal(true);
  };

  const handleSave = async e => {
    e.preventDefault();
    try {
      if (editId) await linksApi.update(editId, form);
      else await linksApi.create(form);
      setShowModal(false);
      load();
    } catch (err) {
      alert(err.message || '保存失败');
    }
  };

  const handleDelete = async id => {
    if (!confirm('确认删除？')) return;
    await linksApi.delete(id);
    load();
  };

  const handleSearch = e => {
    e.preventDefault();
    setPage(1);
    load(1, keyword);
  };

  const totalPages = Math.ceil(total / size);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">导航管理</h1>
        <button className="btn-primary" onClick={openCreate}>+ 添加导航</button>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          className="form-input"
          placeholder="搜索网站名称..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
        />
        <button className="btn-secondary" type="submit">搜索</button>
        {keyword && <button className="btn-ghost" type="button" onClick={() => { setKeyword(''); setPage(1); load(1, ''); }}>清除</button>}
      </form>

      <div className="table-meta">共 {total} 条</div>

      {loading ? <div className="admin-loading">加载中...</div> : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>名称</th><th>地址</th><th>分类</th><th>角标</th><th>点击</th><th>操作</th></tr>
            </thead>
            <tbody>
              {links.map(link => (
                <tr key={link.id}>
                  <td>{link.title}</td>
                  <td><a href={link.url} target="_blank" rel="noopener noreferrer" className="link-url">{link.url}</a></td>
                  <td>{link.category_name || '-'}</td>
                  <td>{link.badge ? <span className="table-badge">{link.badge}</span> : '-'}</td>
                  <td>{link.clicks}</td>
                  <td>
                    <button className="btn-sm btn-edit" onClick={() => openEdit(link)}>编辑</button>
                    <button className="btn-sm btn-delete" onClick={() => handleDelete(link.id)}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => { setPage(p => p - 1); load(page - 1); }}>上一页</button>
          <span>{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => { setPage(p => p + 1); load(page + 1); }}>下一页</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editId ? '编辑导航' : '添加导航'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>网站名称 *</label>
                <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>网站地址 *</label>
                <input className="form-input" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://" required />
              </div>
              <div className="form-group">
                <label>Logo URL</label>
                <input className="form-input" value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))} placeholder="留空自动获取" />
              </div>
              <div className="form-group">
                <label>描述</label>
                <textarea className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              </div>
              <div className="form-group">
                <label>分类</label>
                <select className="form-input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                  <option value="">不分类</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>角标文字 <span className="label-hint">（留空则不显示）</span></label>
                <div className="badge-presets">
                  {BADGE_PRESETS.map(p => (
                    <span key={p.label} className={`badge-preset-item ${form.badge === p.label ? 'active' : ''}`} style={{'--badge-color': p.color}}
                      onClick={() => setForm(f => ({ ...f, badge: f.badge === p.label ? '' : p.label }))}>
                      {p.label}
                    </span>
                  ))}
                </div>
                <input className="form-input" value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="自定义角标，最多5字" maxLength={5} />
              </div>
              {editId && <LinkItemsEditor linkId={editId} />}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
