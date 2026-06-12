import React, { useEffect, useState } from 'react';
import { getP2Sections, createP2Section, updateP2Section, deleteP2Section } from '../../api';

const empty = { title: '', color: '#2a6fb0', sort_order: 0, visible: 1 };

export default function P2Sections() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);

  async function load() { setList(await getP2Sections()); }
  useEffect(() => { load(); }, []);

  function openAdd() { setForm({ ...empty, sort_order: list.length }); setEditing(null); setModal(true); }
  function openEdit(it) { setForm({ ...it }); setEditing(it.id); setModal(true); }
  async function handleSave() {
    if (!form.title.trim()) return;
    if (editing) await updateP2Section(editing, form); else await createP2Section(form);
    setModal(false); load();
  }
  async function handleDelete(id) {
    if (!confirm('确认删除此分区？其下子版块也会一并删除。')) return;
    await deleteP2Section(id); load();
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={s.hdr}>
        <div>
          <h2 style={s.title}>分区管理 · 第二页</h2>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>第二页（论坛样式）的大分区，如「公务管理区」「个人专区」</p>
        </div>
        <button style={s.addBtn} onClick={openAdd}>+ 新增分区</button>
      </div>

      <div style={s.table}>
        <div style={s.thead}>
          <span style={{ flex: 1 }}>分区标题</span>
          <span style={{ width: 80, textAlign: 'center' }}>颜色</span>
          <span style={{ width: 60, textAlign: 'center' }}>排序</span>
          <span style={{ width: 60, textAlign: 'center' }}>可见</span>
          <span style={{ width: 120, textAlign: 'right' }}>操作</span>
        </div>
        {list.map(it => (
          <div key={it.id} style={s.row}>
            <span style={{ flex: 1, fontWeight: 700, color: it.color }}>{it.title}</span>
            <span style={{ width: 80, textAlign: 'center' }}><span style={{ display: 'inline-block', width: 18, height: 18, borderRadius: 4, background: it.color, verticalAlign: 'middle' }} /></span>
            <span style={{ width: 60, textAlign: 'center', color: '#6b7280' }}>{it.sort_order}</span>
            <span style={{ width: 60, textAlign: 'center' }}>
              <span style={{ ...s.badge, background: it.visible ? '#d1fae5' : '#f3f4f6', color: it.visible ? '#065f46' : '#6b7280' }}>{it.visible ? '显示' : '隐藏'}</span>
            </span>
            <span style={{ width: 120, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button style={s.editBtn} onClick={() => openEdit(it)}>编辑</button>
              <button style={s.delBtn} onClick={() => handleDelete(it.id)}>删除</button>
            </span>
          </div>
        ))}
        {list.length === 0 && <div style={s.empty}>暂无分区</div>}
      </div>

      {modal && (
        <div style={s.modalBg} onClick={() => setModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>{editing ? '编辑' : '新增'}分区</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={s.fieldLabel}>分区标题 *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="如 公务管理区"
                style={s.input} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={s.fieldLabel}>标题颜色</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
                <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ ...s.input, flex: 1 }} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={s.fieldLabel}>排序（小在前）</label>
              <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: +e.target.value }))} style={s.input} />
            </div>
            <label style={s.checkLabel}>
              <input type="checkbox" checked={!!form.visible} onChange={e => setForm(f => ({ ...f, visible: e.target.checked ? 1 : 0 }))} />
              <span>显示此分区</span>
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

const s = {
  hdr: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 700 },
  addBtn: { background: 'var(--primary)', color: '#fff', padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600 },
  table: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' },
  thead: { display: 'flex', alignItems: 'center', padding: '10px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280', fontWeight: 600, gap: 8 },
  row: { display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #f3f4f6', fontSize: 14, gap: 8 },
  badge: { padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  editBtn: { background: '#eff2ff', color: 'var(--primary)', padding: '5px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600 },
  delBtn: { background: '#fef2f2', color: '#dc2626', padding: '5px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600 },
  empty: { padding: '40px', textAlign: 'center', color: '#9ca3af' },
  input: { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 },
  modal: { background: '#fff', borderRadius: 14, padding: '28px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
  modalTitle: { fontSize: 17, fontWeight: 700, marginBottom: 20 },
  fieldLabel: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 20, cursor: 'pointer' },
  modalFoot: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { padding: '8px 20px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 14 },
  saveBtn: { padding: '8px 20px', background: 'var(--primary)', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600 },
};
