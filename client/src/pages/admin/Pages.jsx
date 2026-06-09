import React, { useEffect, useState } from 'react';
import { getPages, createPage, updatePage, deletePage } from '../../api';

const empty = { title: '', content: '', visible: 1, sort_order: 0 };

export default function Pages() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);

  async function load() { setList(await getPages()); }
  useEffect(() => { load(); }, []);

  function openAdd() { setForm({ ...empty, sort_order: list.length }); setEditing(null); setModal(true); }
  function openEdit(item) { setForm({ ...item }); setEditing(item.id); setModal(true); }

  async function handleSave() {
    if (!form.title.trim()) return;
    if (editing) await updatePage(editing, form);
    else await createPage(form);
    setModal(false); load();
  }
  async function handleDelete(id) {
    if (!confirm('确认删除此页面？')) return;
    await deletePage(id); load();
  }
  function copyLink(id) {
    const url = `${location.origin}/p/${id}`;
    navigator.clipboard?.writeText(url);
    alert('页面链接已复制：\n' + url + '\n\n可粘贴到「导航管理」的链接里。');
  }

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={s.hdr}>
        <div>
          <h2 style={s.title}>页面管理</h2>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>创建独立内容页（关于/教程/公告等），每个有独立链接 /p/编号，可放到导航</p>
        </div>
        <button style={s.addBtn} onClick={openAdd}>+ 新建页面</button>
      </div>

      <div style={s.table}>
        <div style={s.thead}>
          <span style={{ width: 50 }}>编号</span>
          <span style={{ flex: 1 }}>标题</span>
          <span style={{ width: 70, textAlign: 'center' }}>可见</span>
          <span style={{ width: 180, textAlign: 'right' }}>操作</span>
        </div>
        {list.map(item => (
          <div key={item.id} style={s.row}>
            <span style={{ width: 50, color: '#9ca3af', fontSize: 13 }}>{item.id}</span>
            <span style={{ flex: 1, fontWeight: 600 }}>{item.title}</span>
            <span style={{ width: 70, textAlign: 'center' }}>
              <span style={{ ...s.badge, background: item.visible ? '#d1fae5' : '#f3f4f6', color: item.visible ? '#065f46' : '#6b7280' }}>{item.visible ? '显示' : '隐藏'}</span>
            </span>
            <span style={{ width: 180, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <button style={s.linkBtn} onClick={() => copyLink(item.id)}>复制链接</button>
              <button style={s.editBtn} onClick={() => openEdit(item)}>编辑</button>
              <button style={s.delBtn} onClick={() => handleDelete(item.id)}>删除</button>
            </span>
          </div>
        ))}
        {list.length === 0 && <div style={s.empty}>暂无页面</div>}
      </div>

      {modal && (
        <div style={s.modalBg} onClick={() => setModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>{editing ? '编辑' : '新建'}页面</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={s.fieldLabel}>页面标题 *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="如 关于我们"
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={s.fieldLabel}>页面内容（支持 HTML）</label>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={10}
                placeholder="在这里写页面内容，可用 HTML 排版，如 <h2>标题</h2><p>段落</p>"
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }} />
            </div>
            {editing && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>页面链接：<code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>/p/{editing}</code></div>}
            <label style={s.checkLabel}>
              <input type="checkbox" checked={!!form.visible} onChange={e => setForm(f => ({ ...f, visible: e.target.checked ? 1 : 0 }))} />
              <span>显示此页面</span>
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
  row: { display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f3f4f6', fontSize: 14, gap: 8 },
  badge: { padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  linkBtn: { background: '#f0fdf4', color: '#16a34a', padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' },
  editBtn: { background: '#eff2ff', color: 'var(--primary)', padding: '5px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' },
  delBtn: { background: '#fef2f2', color: '#dc2626', padding: '5px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' },
  empty: { padding: '40px', textAlign: 'center', color: '#9ca3af' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 },
  modal: { background: '#fff', borderRadius: 14, padding: '28px', width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: 17, fontWeight: 700, marginBottom: 20 },
  fieldLabel: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 20, cursor: 'pointer' },
  modalFoot: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { padding: '8px 20px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 14 },
  saveBtn: { padding: '8px 20px', background: 'var(--primary)', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600 },
};
