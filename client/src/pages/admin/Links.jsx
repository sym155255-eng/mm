import React, { useEffect, useState } from 'react';
import { getLinks, createLink, updateLink, deleteLink, getCategories, getSubLinks, createSubLink, updateSubLink, deleteSubLink, getSubCategories, refetchIcons } from '../../api';

const empty = { category_id: '', sub_category_id: '', title: '', url: '', icon: '', description: '', title_color: '', desc_color: '', badge: '', badge_color: '', sort_order: 0, visible: 1 };

export default function Links() {
  const [list, setList] = useState([]);
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [subLinks, setSubLinks] = useState([]);
  const [subCats, setSubCats] = useState([]);
  const [refetching, setRefetching] = useState(false);

  async function handleRefetch() {
    if (!confirm('将重新抓取所有链接的图标并存到服务器本地，可能需要一点时间。继续？')) return;
    setRefetching(true);
    try {
      const r = await refetchIcons();
      alert(`完成！成功抓取 ${r.count}/${r.total} 个图标`);
      load();
    } catch (e) {
      alert('抓取失败：' + e.message);
    }
    setRefetching(false);
  }

  async function load() {
    const [links, categories, subCategories] = await Promise.all([getLinks(), getCategories(), getSubCategories()]);
    setList(links);
    setCats(categories);
    setSubCats(subCategories);
  }
  useEffect(() => { load(); }, []);

  function catName(id) { return cats.find(c => c.id === id)?.name || '未分类'; }

  function openAdd() { setForm({ ...empty, category_id: filterCat || '' }); setEditing(null); setSubLinks([]); setModal(true); }
  async function openEdit(item) {
    setForm({ ...item });
    setEditing(item.id);
    const subs = await getSubLinks(item.id);
    setSubLinks(subs);
    setModal(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.url.trim()) return;
    try {
      if (editing) {
        await updateLink(editing, form);
      } else {
        const res = await createLink(form);
        if (res.id && subLinks.length) {
          for (const sl of subLinks) {
            await createSubLink(res.id, { title: sl.title, url: sl.url, icon: sl.icon || '', sort_order: sl.sort_order || 0 });
          }
        }
      }
    } catch (e) {
      alert('保存失败：' + e.message);
    }
    setModal(false);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('确认删除该链接？')) return;
    await deleteLink(id);
    load();
  }

  const filtered = list.filter(l => {
    const matchCat = !filterCat || l.category_id === parseInt(filterCat);
    const q = search.toLowerCase();
    const matchSearch = !q || l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div>
      <div style={s.hdr}>
        <h2 style={s.title}>链接管理</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={s.refetchBtn} disabled={refetching} onClick={handleRefetch}>
            {refetching ? '抓取中…' : '🔄 重抓图标'}
          </button>
          <button style={s.addBtn} onClick={openAdd}>+ 新增链接</button>
        </div>
      </div>

      <div style={s.filterBar}>
        <input style={s.searchInput} placeholder="搜索链接..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={s.select} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">全部分类</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <span style={s.countBadge}>{filtered.length} 条</span>
      </div>

      <div style={s.table}>
        <div style={s.thead}>
          <span style={{ flex: 2 }}>标题</span>
          <span className="col-url" style={{ flex: 2 }}>URL</span>
          <span style={{ flex: 1 }}>分类</span>
          <span className="col-visible" style={{ width: 70, textAlign: 'center' }}>可见</span>
          <span style={{ width: 130, textAlign: 'right' }}>操作</span>
        </div>
        {filtered.map(item => (
          <div key={item.id} style={s.row}>
            <span style={{ flex: 2, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
            <span className="col-url" style={{ flex: 2, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{item.url}</span>
            <span style={{ flex: 1, color: '#6b7280', fontSize: 13 }}>{catName(item.category_id)}</span>
            <span className="col-visible" style={{ width: 70, textAlign: 'center' }}>
              <span style={{ ...s.badge, background: item.visible ? '#d1fae5' : '#f3f4f6', color: item.visible ? '#065f46' : '#6b7280' }}>
                {item.visible ? '显示' : '隐藏'}
              </span>
            </span>
            <span style={{ width: 130, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <button style={s.editBtn} onClick={() => openEdit(item)}>编辑</button>
              <button style={s.delBtn} onClick={() => handleDelete(item.id)}>删除</button>
            </span>
          </div>
        ))}
        {filtered.length === 0 && <div style={s.empty}>暂无链接</div>}
      </div>

      {modal && (
        <div style={s.modalBg} onClick={() => setModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>{editing ? '编辑链接' : '新增链接'}</h3>
            <div style={s.grid2}>
              <Field label="标题 *" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="网站名称" />
              <Field label="URL *" value={form.url} onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="https://..." />
              <div style={{ marginBottom: 14 }}>
                <label style={s.fieldLabel}>分类</label>
                <select value={form.category_id || ''} onChange={e => setForm(f => ({ ...f, category_id: e.target.value ? +e.target.value : null }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14 }}>
                  <option value="">未分类</option>
                  {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={s.fieldLabel}>子分类（标签页）</label>
                <select value={form.sub_category_id || ''} onChange={e => setForm(f => ({ ...f, sub_category_id: e.target.value ? +e.target.value : null }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14 }}>
                  <option value="">无（直接显示）</option>
                  {subCats.filter(sc => sc.category_id === form.category_id).map(sc => (
                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                  ))}
                </select>
              </div>
              <Field label="图标 URL (留空自动获取)" value={form.icon} onChange={v => setForm(f => ({ ...f, icon: v }))} placeholder="https://..." />
              <Field label="描述" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="简短描述..." />
              <Field label="角标文字（如 HOT、NEW、推荐）" value={form.badge} onChange={v => setForm(f => ({ ...f, badge: v }))} placeholder="留空则不显示" />
              <Field label="排序" value={form.sort_order} type="number" onChange={v => setForm(f => ({ ...f, sort_order: +v }))} />
              <label style={{ ...s.checkLabel, alignSelf: 'flex-end', marginBottom: 14 }}>
                <input type="checkbox" checked={!!form.visible} onChange={e => setForm(f => ({ ...f, visible: e.target.checked ? 1 : 0 }))} />
                <span>显示此链接</span>
              </label>
            </div>
            <SubLinksEditor linkId={editing} subLinks={subLinks} setSubLinks={setSubLinks} />
            {!editing && (
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: -8, marginBottom: 12 }}>
                提示：子链接将在保存主链接后一并创建
              </div>
            )}
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
  hdr: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 700 },
  addBtn: { background: 'var(--primary)', color: '#fff', padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600 },
  refetchBtn: { background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  filterBar: { display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' },
  searchInput: { padding: '8px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, minWidth: 180, flex: 1 },
  select: { padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14 },
  countBadge: { background: '#f3f4f6', color: '#6b7280', padding: '4px 12px', borderRadius: 20, fontSize: 13 },
  table: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' },
  thead: { display: 'flex', alignItems: 'center', padding: '10px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280', fontWeight: 600, gap: 8 },
  row: { display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #f3f4f6', fontSize: 14, gap: 8 },
  badge: { padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  viewBtn: { background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 },
  editBtn: { background: '#eff2ff', color: 'var(--primary)', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 },
  delBtn: { background: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 },
  empty: { padding: '40px', textAlign: 'center', color: '#9ca3af' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: 14, padding: '28px', width: '100%', maxWidth: 640, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' },
  modalTitle: { fontSize: 17, fontWeight: 700, marginBottom: 20 },
  fieldLabel: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 20, cursor: 'pointer' },
  modalFoot: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { padding: '8px 20px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 14 },
  saveBtn: { padding: '8px 20px', background: 'var(--primary)', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600 },
};

function SubLinksEditor({ linkId, subLinks, setSubLinks }) {
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');

  async function handleAdd(e) {
    e.preventDefault();
    if (!newTitle.trim()) { setErr('请填写标题'); return; }
    if (!newUrl.trim())   { setErr('请填写URL');  return; }
    setErr(''); setBusy(true);
    try {
      const item = { title: newTitle.trim(), url: newUrl.trim(), icon: '', sort_order: subLinks.length };
      let newId;
      if (linkId) {
        const res = await createSubLink(linkId, item);
        newId = res.id || Date.now();
      } else {
        // 新增模式：本地暂存，用临时负数 id
        newId = -Date.now();
      }
      setSubLinks(prev => [...prev, { id: newId, link_id: linkId, ...item }]);
      setNewTitle(''); setNewUrl('');
    } catch(e) { setErr('添加失败: ' + e.message); }
    setBusy(false);
  }

  async function handleUpdate(sl) {
    setBusy(true);
    try {
      if (linkId && sl.id > 0) await updateSubLink(sl.id, { ...sl, title: editTitle, url: editUrl });
      setSubLinks(prev => prev.map(s => s.id === sl.id ? { ...s, title: editTitle, url: editUrl } : s));
      setEditId(null);
    } catch(e) { setErr('编辑失败'); }
    setBusy(false);
  }

  async function handleDelete(id) {
    if (!confirm('确认删除此子链接？')) return;
    if (linkId && id > 0) await deleteSubLink(id);
    setSubLinks(prev => prev.filter(s => s.id !== id));
  }

  return (
    <div style={{ marginBottom: 16, borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
        子链接 <span style={{ color: '#9ca3af', fontWeight: 400 }}>({subLinks.length} 条)</span>
      </div>

      {/* 添加行 */}
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input
          placeholder="标题 *"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          style={{ ...sub.inp, flex: '0 0 100px', marginBottom: 0 }}
        />
        <input
          placeholder="URL (https://...) *"
          value={newUrl}
          onChange={e => setNewUrl(e.target.value)}
          style={{ ...sub.inp, flex: 1, marginBottom: 0 }}
        />
        <button type="submit" disabled={busy} style={{ ...sub.confirmBtn, flexShrink: 0 }}>
          {busy ? '…' : '+ 添加'}
        </button>
      </form>
      {err && <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 6 }}>{err}</div>}

      {/* 子链接列表 */}
      {subLinks.length > 0 && (
        <div style={sub.list}>
          {subLinks.map(sl => (
            <div key={sl.id} style={sub.item}>
              {editId === sl.id ? (
                <>
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ ...sub.inp, flex: '0 0 90px', marginBottom: 0 }} />
                  <input value={editUrl} onChange={e => setEditUrl(e.target.value)} style={{ ...sub.inp, flex: 1, marginBottom: 0 }} />
                  <button type="button" onClick={() => handleUpdate(sl)} disabled={busy} style={sub.confirmBtn}>保存</button>
                  <button type="button" onClick={() => setEditId(null)} style={sub.cancelBtn2}>取消</button>
                </>
              ) : (
                <>
                  <span style={sub.dot}>•</span>
                  <span style={sub.title}>{sl.title}</span>
                  <span style={sub.url}>{sl.url}</span>
                  <button type="button" onClick={() => { setEditId(sl.id); setEditTitle(sl.title); setEditUrl(sl.url); }} style={sub.editBtn}>编辑</button>
                  <button type="button" onClick={() => handleDelete(sl.id)} style={sub.delBtn}>删除</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const sub = {
  addBox: { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', marginBottom: 8 },
  inp: { width: '100%', padding: '6px 10px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, marginBottom: 6, boxSizing: 'border-box' },
  confirmBtn: { background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', flexShrink: 0 },
  cancelBtn2: { background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', flexShrink: 0 },
  list: { background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' },
  item: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 12 },
  dot: { color: '#9ca3af', flexShrink: 0 },
  title: { fontWeight: 600, color: '#1a1a2e', flexShrink: 0, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  url: { flex: 1, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 },
  editBtn: { background: '#eff2ff', color: 'var(--primary)', border: 'none', borderRadius: 5, padding: '3px 8px', fontSize: 11, cursor: 'pointer', flexShrink: 0 },
  delBtn: { background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 5, padding: '3px 8px', fontSize: 11, cursor: 'pointer', flexShrink: 0 },
};
