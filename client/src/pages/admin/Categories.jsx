import { useEffect, useState } from 'react';
import { categoriesApi } from '../../api';

const emptyForm = { name: '', sort: 0, icon: '' };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const load = () => categoriesApi.getAll().then(res => setCategories(res.data));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = cat => { setForm({ name: cat.name, sort: cat.sort, icon: cat.icon || '' }); setEditId(cat.id); setShowModal(true); };

  const handleSave = async e => {
    e.preventDefault();
    try {
      if (editId) await categoriesApi.update(editId, form);
      else await categoriesApi.create(form);
      setShowModal(false);
      load();
    } catch (err) {
      alert(err.message || '保存失败');
    }
  };

  const handleDelete = async id => {
    if (!confirm('删除分类后，该分类下的导航将变为未分类，确认删除？')) return;
    await categoriesApi.delete(id);
    load();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">分类管理</h1>
        <button className="btn-primary" onClick={openCreate}>+ 添加分类</button>
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>图标</th><th>名称</th><th>排序</th><th>操作</th></tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id}>
                <td className="icon-cell">{cat.icon}</td>
                <td>{cat.name}</td>
                <td>{cat.sort}</td>
                <td>
                  <button className="btn-sm btn-edit" onClick={() => openEdit(cat)}>编辑</button>
                  <button className="btn-sm btn-delete" onClick={() => handleDelete(cat.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editId ? '编辑分类' : '添加分类'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>分类名称 *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>图标（Emoji）</label>
                <input className="form-input" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="如: 🔧" />
              </div>
              <div className="form-group">
                <label>排序（数值越小越靠前）</label>
                <input type="number" className="form-input" value={form.sort} onChange={e => setForm(f => ({ ...f, sort: parseInt(e.target.value) || 0 }))} />
              </div>
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
