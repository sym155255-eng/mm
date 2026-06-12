import React, { useEffect, useState, useRef } from 'react';
import { getP2Posts, createP2Post, updateP2Post, deleteP2Post, getP2Sections, getP2Boards, uploadIcon } from '../../api';

const empty = { section_id: '', board_id: '', avatar: '', title: '', tag: '', tag_color: '#ff7a45', category: '', author: '', author_vip: 0, post_time: '', last_user: '', last_time: '', comments: '', url: '', sort_order: 0, visible: 1 };

// 系统自带头像库（emoji）
const AVATAR_LIBRARY = [
  // 人物
  '👤','👨','👩','🧑','👶','👦','👧','👴','👵','🧔','👨‍💻','👩‍💻','🕵️','💂','👮','🤴','👸','🦸','🦹','🧙',
  // 表情
  '😄','😁','😂','🤣','😊','😎','🤓','🧐','🤠','🥳','😏','😇','🤩','😈','🤡','👻','💀','👽','🤖','🎃',
  // 动物
  '🐱','🐶','🐼','🐯','🦁','🐲','🦊','🐻','🐨','🐰','🐹','🐸','🐵','🦅','🦉','🦋','🐠','🐳','🦄','🐺',
  // 其他
  '👑','🔥','⭐','💎','🌙','☀️','⚡','🌈','🍀','🌸','❤️','💜','🖤','💯','🏆','🎯','🎮','🎵','⚽','💰',
];

export default function P2Posts() {
  const [list, setList] = useState([]);
  const [sections, setSections] = useState([]);
  const [boards, setBoards] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [filterSec, setFilterSec] = useState('');

  async function load() {
    const [posts, secs, bds] = await Promise.all([getP2Posts(), getP2Sections(), getP2Boards()]);
    setList(Array.isArray(posts) ? posts : []);
    setSections(Array.isArray(secs) ? secs : []);
    setBoards(Array.isArray(bds) ? bds : []);
  }
  useEffect(() => { load(); }, []);

  function secName(id) { return sections.find(x => x.id === id)?.title || '—'; }
  function boardName(id) { return boards.find(x => x.id === id)?.title || ''; }
  function openAdd() { setForm({ ...empty, board_id: boards[0]?.id || '', sort_order: list.length }); setEditing(null); setModal(true); }
  function openEdit(it) { setForm({ ...it }); setEditing(it.id); setModal(true); }
  async function handleSave() {
    if (!form.title.trim() || !form.board_id) { alert('请填标题并选择所属子版块'); return; }
    if (editing) await updateP2Post(editing, form); else await createP2Post(form);
    setModal(false); load();
  }
  async function handleDelete(id) {
    if (!confirm('确认删除此帖子？')) return;
    await deleteP2Post(id); load();
  }

  const filtered = filterSec ? list.filter(p => p.section_id === +filterSec) : list;

  return (
    <div style={{ maxWidth: 920 }}>
      <div style={s.hdr}>
        <div>
          <h2 style={s.title}>帖子管理 · 第二页</h2>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>显示在分区下方的帖子信息流</p>
        </div>
        <button style={s.addBtn} onClick={openAdd} disabled={boards.length === 0}>+ 新增帖子</button>
      </div>

      {boards.length === 0 && <div style={s.warn}>请先到「子版块管理」创建至少一个子版块。</div>}

      <div style={s.filterBar}>
        <select style={s.select} value={filterSec} onChange={e => setFilterSec(e.target.value)}>
          <option value="">全部分区</option>
          {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.title}</option>)}
        </select>
        <span style={s.countBadge}>{filtered.length} 条</span>
      </div>

      <div style={s.table}>
        <div style={s.thead}>
          <span style={{ width: 40 }}>头像</span>
          <span style={{ flex: 1 }}>标题</span>
          <span style={{ width: 120 }}>子版块</span>
          <span style={{ width: 80 }}>评论</span>
          <span style={{ width: 110, textAlign: 'right' }}>操作</span>
        </div>
        {filtered.map(it => (
          <div key={it.id} style={s.row}>
            <span style={{ width: 40 }}>
              {!it.avatar ? <span style={{ fontSize: 18 }}>👤</span>
                : /^(\/|https?:|data:)/.test(it.avatar) ? <img src={it.avatar} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22 }}>{it.avatar}</span>}
            </span>
            <span style={{ flex: 1, fontWeight: 600 }}>{it.title}{it.tag && <span style={{ marginLeft: 6, fontSize: 11, color: it.tag_color, fontWeight: 700 }}>{it.tag}</span>}</span>
            <span style={{ width: 120, color: '#6b7280', fontSize: 13 }}>{boardName(it.board_id) || secName(it.section_id)}</span>
            <span style={{ width: 80, color: '#9ca3af', fontSize: 12 }}>💬 {it.comments || 0}</span>
            <span style={{ width: 110, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <button style={s.editBtn} onClick={() => openEdit(it)}>编辑</button>
              <button style={s.delBtn} onClick={() => handleDelete(it.id)}>删除</button>
            </span>
          </div>
        ))}
        {filtered.length === 0 && <div style={s.empty}>暂无帖子</div>}
      </div>

      {modal && (
        <div style={s.modalBg} onClick={() => setModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>{editing ? '编辑' : '新增'}帖子</h3>
            <div style={s.grid2}>
              <div style={{ marginBottom: 14 }}>
                <label style={s.fieldLabel}>所属子版块 *</label>
                <select value={form.board_id || ''} onChange={e => setForm(f => ({ ...f, board_id: +e.target.value }))} style={s.input}>
                  <option value="">选择子版块</option>
                  {boards.map(b => <option key={b.id} value={b.id}>{secName(b.section_id)} / {b.title}</option>)}
                </select>
              </div>
              <Field label="标题 *" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="如 【老友会】专属活动" />
              <Field label="标签（如 热门 / NEW / 投票）" value={form.tag} onChange={v => setForm(f => ({ ...f, tag: v }))} placeholder="留空不显示" />
              <div style={{ marginBottom: 14 }}>
                <label style={s.fieldLabel}>标签颜色</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="color" value={form.tag_color || '#ff7a45'} onChange={e => setForm(f => ({ ...f, tag_color: e.target.value }))} style={{ width: 38, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
                  <input value={form.tag_color || ''} onChange={e => setForm(f => ({ ...f, tag_color: e.target.value }))} style={{ ...s.input, flex: 1 }} />
                </div>
              </div>
              <Field label="分类（如 白嫖 / 综合 / 交流）" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} />
              <Field label="作者" value={form.author} onChange={v => setForm(f => ({ ...f, author: v }))} placeholder="如 老哥" />
              <Field label="发帖时间" value={form.post_time} onChange={v => setForm(f => ({ ...f, post_time: v }))} placeholder="如 2月前 / 2025-4-30" />
              <Field label="最后评论人" value={form.last_user} onChange={v => setForm(f => ({ ...f, last_user: v }))} placeholder="如 阿操" />
              <Field label="最后评论时间" value={form.last_time} onChange={v => setForm(f => ({ ...f, last_time: v }))} placeholder="如 2分钟前" />
              <Field label="评论数" value={form.comments} onChange={v => setForm(f => ({ ...f, comments: v }))} placeholder="如 2.2k" />
              <Field label="点击跳转链接" value={form.url} onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="https://..." />
              <Field label="排序" type="number" value={form.sort_order} onChange={v => setForm(f => ({ ...f, sort_order: +v }))} />
            </div>
            <AvatarField value={form.avatar} onChange={v => setForm(f => ({ ...f, avatar: v }))} />
            <div style={{ display: 'flex', gap: 20, marginBottom: 18 }}>
              <label style={s.checkLabel}>
                <input type="checkbox" checked={!!form.author_vip} onChange={e => setForm(f => ({ ...f, author_vip: e.target.checked ? 1 : 0 }))} />
                <span>作者带 V 标</span>
              </label>
              <label style={s.checkLabel}>
                <input type="checkbox" checked={!!form.visible} onChange={e => setForm(f => ({ ...f, visible: e.target.checked ? 1 : 0 }))} />
                <span>显示此帖</span>
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
      <label style={s.fieldLabel}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={s.input} />
    </div>
  );
}

function AvatarField({ value, onChange }) {
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
  const isImg = value && /^(\/|https?:|data:)/.test(value);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={s.fieldLabel}>头像（头像库点选 / 上传）</label>

      {/* 系统自带头像库 */}
      <div style={s.iconLib}>
        {AVATAR_LIBRARY.map(em => (
          <button key={em} type="button" onClick={() => onChange(em)}
            style={{ ...s.iconBtn, ...(value === em ? s.iconBtnActive : {}) }}>{em}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {value && (isImg
          ? <img src={value} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e5e7eb', flexShrink: 0 }} onError={e => e.target.style.display='none'} />
          : <span style={{ width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{value}</span>)}
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="头像库点选，或填图片URL / 上传" style={{ ...s.input, flex: 1 }} />
        <input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        <button type="button" onClick={() => ref.current?.click()} disabled={uploading} style={{ background: '#eff2ff', color: 'var(--primary)', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>{uploading ? '上传中…' : '📁 上传'}</button>
        {value && <button type="button" onClick={() => onChange('')} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>清除</button>}
      </div>
    </div>
  );
}

const s = {
  hdr: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 700 },
  addBtn: { background: 'var(--primary)', color: '#fff', padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600 },
  warn: { background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 },
  filterBar: { display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' },
  select: { padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14 },
  countBadge: { background: '#f3f4f6', color: '#6b7280', padding: '4px 12px', borderRadius: 20, fontSize: 13 },
  table: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' },
  thead: { display: 'flex', alignItems: 'center', padding: '10px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280', fontWeight: 600, gap: 8 },
  row: { display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #f3f4f6', fontSize: 14, gap: 8 },
  editBtn: { background: '#eff2ff', color: 'var(--primary)', padding: '5px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600 },
  delBtn: { background: '#fef2f2', color: '#dc2626', padding: '5px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600 },
  empty: { padding: '40px', textAlign: 'center', color: '#9ca3af' },
  input: { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' },
  iconLib: { display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10, maxHeight: 132, overflowY: 'auto', padding: 4, border: '1px solid #eef2f6', borderRadius: 8, background: '#fafbfc' },
  iconBtn: { width: 34, height: 34, fontSize: 20, lineHeight: 1, border: '1px solid transparent', borderRadius: 8, background: 'transparent', cursor: 'pointer', padding: 0 },
  iconBtnActive: { background: '#eff2ff', borderColor: 'var(--primary)' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 },
  modal: { background: '#fff', borderRadius: 14, padding: '28px', width: '100%', maxWidth: 640, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: 17, fontWeight: 700, marginBottom: 20 },
  fieldLabel: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' },
  modalFoot: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { padding: '8px 20px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 14 },
  saveBtn: { padding: '8px 20px', background: 'var(--primary)', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600 },
};
