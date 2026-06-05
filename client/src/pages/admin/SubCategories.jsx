import React, { useEffect, useState } from 'react';
import { getCategories, getSubCategories, createSubCategory, updateSubCategory, deleteSubCategory } from '../../api';

export default function SubCategories() {
  const [cats, setCats] = useState([]);
  const [subs, setSubs] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');

  async function load() {
    const [c, s] = await Promise.all([getCategories(), getSubCategories()]);
    setCats(c);
    setSubs(s);
    if (!activeCat && c.length) setActiveCat(c[0].id);
  }
  useEffect(() => { load(); }, []);

  const catSubs = subs.filter(s => s.category_id === activeCat);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim() || !activeCat) return;
    await createSubCategory({ category_id: activeCat, name: newName.trim(), sort_order: catSubs.length });
    setNewName('');
    load();
  }

  async function handleUpdate(id) {
    await updateSubCategory(id, { name: editName, sort_order: 0 });
    setEditId(null);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('确认删除此子分类？其下链接将归为无子分类。')) return;
    await deleteSubCategory(id);
    load();
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>子分类管理</h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>
        为每个大分类创建子分类标签页（如"AI工具"、"在线图床"），编辑链接时可归到对应子分类。
      </p>

      {/* 选择大分类 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {cats.map(c => (
          <button key={c.id} onClick={() => setActiveCat(c.id)}
            style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 14, cursor: 'pointer', border: 'none',
              background: activeCat === c.id ? 'var(--primary)' : '#f3f4f6',
              color: activeCat === c.id ? '#fff' : '#374151', fontWeight: activeCat === c.id ? 600 : 400,
            }}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {activeCat && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
          {/* 添加 */}
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="子分类名称，如 AI工具"
              style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14 }} />
            <button type="submit" style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              + 添加
            </button>
          </form>

          {/* 列表 */}
          {catSubs.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>暂无子分类</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {catSubs.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f9fafb', borderRadius: 8 }}>
                  {editId === s.id ? (
                    <>
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        style={{ flex: 1, padding: '6px 10px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13 }} />
                      <button onClick={() => handleUpdate(s.id)} style={btn.save}>保存</button>
                      <button onClick={() => setEditId(null)} style={btn.cancel}>取消</button>
                    </>
                  ) : (
                    <>
                      <span style={{ color: '#9ca3af', fontSize: 13, width: 20 }}>{i + 1}</span>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{s.name}</span>
                      <button onClick={() => { setEditId(s.id); setEditName(s.name); }} style={btn.edit}>编辑</button>
                      <button onClick={() => handleDelete(s.id)} style={btn.del}>删除</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const btn = {
  save: { background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' },
  cancel: { background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' },
  edit: { background: '#eff2ff', color: 'var(--primary)', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  del: { background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
};
