import React, { useEffect, useState } from 'react';
import { getNavs, createNav, updateNav, deleteNav } from '../../api';

const empty = { title: '', url: '', icon: '', color: '', visible: 1, sort_order: 0 };

export default function Navs() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);

  async function load() { setList(await getNavs()); }
  useEffect(() => { load(); }, []);

  function openAdd() { setForm({ ...empty, sort_order: list.length }); setEditing(null); setModal(true); }
  function openEdit(item) { setForm({ ...item }); setEditing(item.id); setModal(true); }

  async function handleSave() {
    if (!form.title.trim()) return;
    if (editing) await updateNav(editing, form);
    else await createNav(form);
    setModal(false); load();
  }
  async function handleDelete(id) {
    if (!confirm('确认删除此导航项？')) return;
    await deleteNav(id); load();
  }
  async function move(item, dir) {
    const arr = [...list];
    const i = arr.findIndex(x => x.id === item.id);
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    for (let k = 0; k < arr.length; k++) await updateNav(arr[k].id, { ...arr[k], sort_order: k });
    load();
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={s.hdr}>
        <div>
          <h2 style={s.title}>导航管理</h2>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>显示在广告栏下方的横向快捷导航</p>
        </div>
        <button style={s.addBtn} onClick={openAdd}>+ 新增导航</button>
      </div>

      <div style={s.table}>
        <div style={s.thead}>
          <span style={{ width: 56 }}>排序</span>
          <span style={{ flex: 1 }}>名称</span>
          <span style={{ flex: 1 }}>链接</span>
          <span style={{ width: 70, textAlign: 'center' }}>可见</span>
          <span style={{ width: 120, textAlign: 'right' }}>操作</span>
        </div>
        {list.map((item, i) => (
          <div key={item.id} style={s.row}>
            <span style={{ width: 56, display: 'flex', gap: 2 }}>
              <button onClick={() => move(item, -1)} disabled={i === 0} style={s.mv}>↑</button>
              <button onClick={() => move(item, 1)} disabled={i === list.length - 1} style={s.mv}>↓</button>
            </span>
            <span style={{ flex: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              {item.icon && <span>{item.icon}</span>}{item.title}
            </span>
            <span style={{ flex: 1, color: '#6b7280', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.url || '—'}</span>
            <span style={{ width: 70, textAlign: 'center' }}>
              <span style={{ ...s.badge, background: item.visible ? '#d1fae5' : '#f3f4f6', color: item.visible ? '#065f46' : '#6b7280' }}>{item.visible ? '显示' : '隐藏'}</span>
            </span>
            <span style={{ width: 120, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button style={s.editBtn} onClick={() => openEdit(item)}>编辑</button>
              <button style={s.delBtn} onClick={() => handleDelete(item.id)}>删除</button>
            </span>
          </div>
        ))}
        {list.length === 0 && <div style={s.empty}>暂无导航项</div>}
      </div>

      {modal && (
        <div style={s.modalBg} onClick={() => setModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>{editing ? '编辑' : '新增'}导航</h3>
            <Field label="名称 *" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="如 优惠活动" />
            <Field label="链接 URL" value={form.url} onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="https://..." />
            <Field label="图标 emoji（可选）" value={form.icon} onChange={v => setForm(f => ({ ...f, icon: v }))} placeholder="🔥" />
            <div style={{ marginBottom: 14 }}>
              <label style={s.fieldLabel}>文字颜色</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="color" value={form.color || '#374151'} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
                <input type="text" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="留空用默认"
                  style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14 }} />
              </div>
            </div>
            <label style={s.checkLabel}>
              <input type="checkbox" checked={!!form.visible} onChange={e => setForm(f => ({ ...f, visible: e.target.checked ? 1 : 0 }))} />
              <span>显示此项</span>
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

function Field({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
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
  mv: { width: 24, height: 24, border: '1px solid #e5e7eb', background: '#fff', borderRadius: 5, cursor: 'pointer', fontSize: 12, padding: 0 },
  badge: { padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  editBtn: { background: '#eff2ff', color: 'var(--primary)', padding: '5px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600 },
  delBtn: { background: '#fef2f2', color: '#dc2626', padding: '5px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600 },
  empty: { padding: '40px', textAlign: 'center', color: '#9ca3af' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: 14, padding: '28px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
  modalTitle: { fontSize: 17, fontWeight: 700, marginBottom: 20 },
  fieldLabel: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 20, cursor: 'pointer' },
  modalFoot: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { padding: '8px 20px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 14 },
  saveBtn: { padding: '8px 20px', background: 'var(--primary)', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600 },
};
