import React, { useEffect, useState } from 'react';
import { getAds, createAd, updateAd, deleteAd } from '../../api';

const empty = { title: '', url: '', image_url: '', description: '', position: 'top', visible: 1, sort_order: 0, title_color: '', desc_color: '', badge: '', badge_color: '' };

export default function Ads() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);

  async function load() { setList(await getAds()); }
  useEffect(() => { load(); }, []);

  function openAdd() { setForm(empty); setEditing(null); setModal(true); }
  function openEdit(item) { setForm({ ...item }); setEditing(item.id); setModal(true); }

  async function handleSave() {
    if (!form.title.trim()) return;
    if (editing) await updateAd(editing, form);
    else await createAd(form);
    setModal(false);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('确认删除此广告/公告？')) return;
    await deleteAd(id);
    load();
  }

  return (
    <div>
      <div style={s.hdr}>
        <div>
          <h2 style={s.title}>广告/公告管理</h2>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>可用于展示广告横幅或公告信息</p>
        </div>
        <button style={s.addBtn} onClick={openAdd}>+ 新增</button>
      </div>

      <div style={s.table}>
        <div style={s.thead}>
          <span style={{ flex: 2 }}>标题</span>
          <span style={{ flex: 1 }}>位置</span>
          <span style={{ width: 80, textAlign: 'center' }}>可见</span>
          <span style={{ width: 120, textAlign: 'right' }}>操作</span>
        </div>
        {list.map(item => (
          <div key={item.id} style={s.row}>
            <span style={{ flex: 2, fontWeight: 600 }}>{item.title}</span>
            <span style={{ flex: 1, color: '#6b7280', fontSize: 13 }}>{item.position === 'top' ? '顶部' : '其他'}</span>
            <span style={{ width: 80, textAlign: 'center' }}>
              <span style={{ ...s.badge, background: item.visible ? '#d1fae5' : '#f3f4f6', color: item.visible ? '#065f46' : '#6b7280' }}>
                {item.visible ? '显示' : '隐藏'}
              </span>
            </span>
            <span style={{ width: 120, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button style={s.editBtn} onClick={() => openEdit(item)}>编辑</button>
              <button style={s.delBtn} onClick={() => handleDelete(item.id)}>删除</button>
            </span>
          </div>
        ))}
        {list.length === 0 && <div style={s.empty}>暂无广告/公告</div>}
      </div>

      {modal && (
        <div style={s.modalBg} onClick={() => setModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>{editing ? '编辑' : '新增'}广告/公告</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="标题 *" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="广告标题或公告内容" />
              <Field label="描述文字" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="副标题或补充说明..." />
              <Field label="角标文字（如 HOT、NEW、广告）" value={form.badge} onChange={v => setForm(f => ({ ...f, badge: v }))} placeholder="留空则不显示" />
              <Field label="链接 URL" value={form.url} onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="https://..." />
              <Field label="图片 URL (可选)" value={form.image_url} onChange={v => setForm(f => ({ ...f, image_url: v }))} placeholder="https://..." />
              <div style={{ marginBottom: 14 }}>
                <label style={s.fieldLabel}>显示位置</label>
                <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14 }}>
                  <option value="top">顶部横幅</option>
                  <option value="sidebar">侧边栏</option>
                </select>
              </div>
              <Field label="排序" value={form.sort_order} type="number" onChange={v => setForm(f => ({ ...f, sort_order: +v }))} />
              <label style={{ ...s.checkLabel, alignSelf: 'flex-end', marginBottom: 14 }}>
                <input type="checkbox" checked={!!form.visible} onChange={e => setForm(f => ({ ...f, visible: e.target.checked ? 1 : 0 }))} />
                <span>显示此项</span>
              </label>
            </div>
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
  hdr: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
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
  modal: { background: '#fff', borderRadius: 14, padding: '28px', width: '100%', maxWidth: 620, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: 17, fontWeight: 700, marginBottom: 20 },
  fieldLabel: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 20, cursor: 'pointer' },
  modalFoot: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { padding: '8px 20px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 14 },
  saveBtn: { padding: '8px 20px', background: 'var(--primary)', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600 },
};
