import React, { useEffect, useState } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api';

const empty = { name: '', icon: '🔗', sort_order: 0, visible: 1 };

export default function Categories({ group = 'home' }) {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);

  async function load() { setList(await getCategories(group)); }
  useEffect(() => { load(); }, [group]);

  function openAdd() { setForm({ ...empty, page_group: group }); setEditing(null); setModal(true); }
  function openEdit(cat) { setForm({ ...cat }); setEditing(cat.id); setModal(true); }

  async function handleSave() {
    if (!form.name.trim()) return;
    const payload = { ...form, page_group: form.page_group || group };
    if (editing) await updateCategory(editing, payload);
    else await createCategory(payload);
    setModal(false);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('确认删除该分类？其下链接将变为未分类。')) return;
    await deleteCategory(id);
    load();
  }

  return (
    <div>
      <div style={s.hdr}>
        <h2 style={s.title}>分类管理</h2>
        <button style={s.addBtn} onClick={openAdd}>+ 新增分类</button>
      </div>

      <div style={s.table}>
        <div style={s.thead}>
          <span style={{ flex: 1 }}>图标 + 名称</span>
          <span style={{ width: 80, textAlign: 'center' }}>排序</span>
          <span style={{ width: 80, textAlign: 'center' }}>可见</span>
          <span style={{ width: 120, textAlign: 'right' }}>操作</span>
        </div>
        {list.map(cat => (
          <div key={cat.id} style={s.row}>
            <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{cat.icon}</span>
              <span style={{ fontWeight: 600 }}>{cat.name}</span>
            </span>
            <span style={{ width: 80, textAlign: 'center', color: '#6b7280' }}>{cat.sort_order}</span>
            <span style={{ width: 80, textAlign: 'center' }}>
              <span style={{ ...s.badge, background: cat.visible ? '#d1fae5' : '#f3f4f6', color: cat.visible ? '#065f46' : '#6b7280' }}>
                {cat.visible ? '显示' : '隐藏'}
              </span>
            </span>
            <span style={{ width: 120, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button style={s.editBtn} onClick={() => openEdit(cat)}>编辑</button>
              <button style={s.delBtn} onClick={() => handleDelete(cat.id)}>删除</button>
            </span>
          </div>
        ))}
        {list.length === 0 && <div style={s.empty}>暂无分类</div>}
      </div>

      {modal && (
        <div style={s.modalBg} onClick={() => setModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>{editing ? '编辑分类' : '新增分类'}</h3>
            <Field label="名称" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="分类名称" />
            <Field label="图标 (emoji)" value={form.icon} onChange={v => setForm(f => ({ ...f, icon: v }))} placeholder="🔗" />
            <Field label="排序 (数字越小越靠前)" value={form.sort_order} type="number" onChange={v => setForm(f => ({ ...f, sort_order: +v }))} />
            <label style={s.checkLabel}>
              <input type="checkbox" checked={!!form.visible} onChange={e => setForm(f => ({ ...f, visible: e.target.checked ? 1 : 0 }))} />
              <span>显示此分类</span>
            </label>
            <div style={s.modalFoot}>
              <button style={s.cancelBtn} onClick={() => setModal(false)}>取消</button>
              <button style={s.saveBtn} onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14 }} />
    </div>
  );
}

const s = {
  hdr: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 700 },
  addBtn: { background: 'var(--primary)', color: '#fff', padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600 },
  table: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' },
  thead: { display: 'flex', alignItems: 'center', padding: '10px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280', fontWeight: 600 },
  row: { display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f3f4f6', fontSize: 14 },
  badge: { padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  editBtn: { background: '#eff2ff', color: 'var(--primary)', padding: '5px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600 },
  delBtn: { background: '#fef2f2', color: '#dc2626', padding: '5px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600 },
  empty: { padding: '40px', textAlign: 'center', color: '#9ca3af' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: 14, padding: '28px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
  modalTitle: { fontSize: 17, fontWeight: 700, marginBottom: 20 },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 20, cursor: 'pointer' },
  modalFoot: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { padding: '8px 20px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 14 },
  saveBtn: { padding: '8px 20px', background: 'var(--primary)', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600 },
};
