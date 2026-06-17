import React, { useEffect, useState, useRef } from 'react';
import { getAds, createAd, updateAd, deleteAd, uploadIcon, getAdSubLinks, createAdSubLink, updateAdSubLink, deleteAdSubLink } from '../../api';

const empty = { title: '', url: '', image_url: '', description: '', position: 'top', visible: 1, sort_order: 0, title_color: '', desc_color: '', badge: '', badge_color: '' };

export default function Ads() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [subLinks, setSubLinks] = useState([]);

  async function load() { setList(await getAds()); }
  useEffect(() => { load(); }, []);

  function openAdd() { setForm(empty); setEditing(null); setSubLinks([]); setModal(true); }
  async function openEdit(item) { setForm({ ...item }); setEditing(item.id); setSubLinks(await getAdSubLinks(item.id)); setModal(true); }

  async function handleSave() {
    if (!form.title.trim()) return;
    if (editing) {
      await updateAd(editing, form);
    } else {
      const res = await createAd(form);
      if (res.id && subLinks.length) {
        for (const sl of subLinks) await createAdSubLink(res.id, { title: sl.title, url: sl.url, icon: sl.icon || '', sort_order: sl.sort_order || 0 });
      }
    }
    setModal(false);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('确认删除此广告/公告？')) return;
    await deleteAd(id);
    load();
  }

  async function toggleVisible(item) {
    await updateAd(item.id, { ...item, visible: item.visible ? 0 : 1 });
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
              <button onClick={() => toggleVisible(item)} title="点击切换显示/隐藏"
                style={{ ...s.badge, border: 'none', cursor: 'pointer', background: item.visible ? '#dcfce7' : '#f3f4f6', color: item.visible ? '#16a34a' : '#9ca3af' }}>
                {item.visible ? '✓ 显示' : '✕ 隐藏'}
              </button>
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
            <div className="modal-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="标题 *" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="广告标题或公告内容" />
              <Field label="描述文字" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="副标题或补充说明..." />
              <Field label="角标文字（如 HOT、NEW、广告）" value={form.badge} onChange={v => setForm(f => ({ ...f, badge: v }))} placeholder="留空则不显示" />
              <Field label="链接 URL" value={form.url} onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="https://..." />
              <ImageField value={form.image_url} onChange={v => setForm(f => ({ ...f, image_url: v }))} />
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
            <AdSubLinksEditor adId={editing} subLinks={subLinks} setSubLinks={setSubLinks} />
            {!editing && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: -6, marginBottom: 12 }}>提示：子链接将在保存后一并创建</div>}
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

function ImageField({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef(null);
  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { const res = await uploadIcon(file); if (res.path) onChange(res.path); else alert('上传失败'); }
    catch (err) { alert('上传失败：' + err.message); }
    setUploading(false); e.target.value = '';
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' }}>图片（可上传 / 填URL）</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {value && <img src={value} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain', border: '1px solid #e5e7eb', flexShrink: 0 }} onError={e => e.target.style.display='none'} />}
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="图片URL 或 点右侧上传"
          style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, minWidth: 0 }} />
        <input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
          style={{ background: '#eff2ff', color: 'var(--primary)', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>{uploading ? '上传中…' : '📁 上传'}</button>
        {value && <button type="button" onClick={() => onChange('')} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>清除</button>}
      </div>
    </div>
  );
}

function AdSubLinksEditor({ adId, subLinks, setSubLinks }) {
  const [nt, setNt] = useState('');
  const [nu, setNu] = useState('');
  const [busy, setBusy] = useState(false);

  async function add(e) {
    e.preventDefault();
    if (!nt.trim() || !nu.trim()) { alert('请填标题和URL'); return; }
    setBusy(true);
    try {
      const item = { title: nt.trim(), url: nu.trim(), icon: '', sort_order: subLinks.length };
      let id;
      if (adId) { const r = await createAdSubLink(adId, item); id = r.id || Date.now(); }
      else id = -Date.now();
      setSubLinks(prev => [...prev, { id, ...item }]);
      setNt(''); setNu('');
    } catch (err) { alert('添加失败：' + err.message); }
    setBusy(false);
  }
  async function del(id) {
    if (!confirm('删除此子链接？')) return;
    if (adId && id > 0) await deleteAdSubLink(id);
    setSubLinks(prev => prev.filter(s => s.id !== id));
  }

  return (
    <div style={{ marginBottom: 16, borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
        子链接 <span style={{ color: '#9ca3af', fontWeight: 400 }}>({subLinks.length} 条，点击广告会弹出这些链接)</span>
      </div>
      <form onSubmit={add} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input placeholder="标题 *" value={nt} onChange={e => setNt(e.target.value)} style={{ flex: '0 0 110px', padding: '6px 10px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
        <input placeholder="URL (https://...) *" value={nu} onChange={e => setNu(e.target.value)} style={{ flex: 1, padding: '6px 10px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
        <button type="submit" disabled={busy} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>{busy ? '…' : '+ 添加'}</button>
      </form>
      {subLinks.length > 0 && (
        <div style={{ background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {subLinks.map(sl => (
            <div key={sl.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: '#1a1a2e', flexShrink: 0, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sl.title}</span>
              <span style={{ flex: 1, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sl.url}</span>
              <button type="button" onClick={() => del(sl.id)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 5, padding: '3px 8px', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>删除</button>
            </div>
          ))}
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
