import React, { useEffect, useState, useRef } from 'react';
import { getP2Boards, createP2Board, updateP2Board, deleteP2Board, getP2Sections, uploadIcon } from '../../api';

const empty = { section_id: '', title: '', icon: '', badge: '', threads: '', posts: '', last_post: '', url: '', sort_order: 0, visible: 1 };

// 系统自带图标库（emoji）
const ICON_LIBRARY = [
  // 公告/管理
  '📢','📣','📌','📋','📝','💬','🗂️','📁','🗃️','🗄️','📊','📈','📤','📥','🔔','🛎️',
  // 热门/精品
  '🔥','⭐','🌟','💎','🎁','🏆','🥇','🥈','🥉','🎖️','🏅','👑','💫','✨','🎯','🚩',
  // 影音娱乐
  '🎬','🎞️','📺','📽️','🎥','🎵','🎶','🎤','🎧','🎸','🎹','🎻','📻','🎭','🎪','🎫',
  // 游戏休闲
  '🎮','🕹️','🎲','♟️','🃏','🀄','🎳','🎱','🧩','🪀',
  // 体育
  '⚽','🏀','🏈','⚾','🎾','🏐','🏓','🏸','🥊','🏊','🚴','🏃','⛳','🎿',
  // 金融/商城
  '🎰','💰','💸','💵','💴','💶','💳','🪙','🏦','🛒','🛍️','🏷️','🧧','💹',
  // 标记
  '🔞','🆕','🆓','🆒','🆙','🈲','✅','❌','⭕','❗','❓','💯','♨️','🔱',
  // 心情/人物
  '❤️','🧡','💛','💚','💙','💜','🖤','💖','👥','🙋','🤝','👍','👏','🙏','😄','😎','🤖','👻','💀','👽',
  // 网络/工具
  '🌐','🔗','🛠️','⚙️','🔧','🔨','🔍','🔎','📡','💻','🖥️','📱','⌨️','🖱️','💾','🔒','🔓','🔑',
  // 交通/旅行
  '🚀','✈️','🚗','🚕','🚌','🚂','🛳️','⚓','🗺️','🧭',
  // 自然/天气
  '⚡','🌈','☀️','🌙','🌍','🌸','🌹','🍀','🌴','🍁','❄️','🌊','⛰️','🌋',
  // 美食
  '🍔','🍕','🍜','🍣','🍦','🍰','🍺','🍷','☕','🍉','🍓','🍑',
  // 节日/活动
  '🎉','🎊','🎈','🎂','🎄','🎃','🧨','🎆','🎇','🛐',
  // 动物
  '🐱','🐶','🐼','🐯','🦁','🐲','🦅','🦋','🐠','🐳',
  // 学习/办公
  '📚','📖','📰','🗞️','✏️','🖊️','📐','🧮','🎓','🔬','🔭','🧪',
  // 图片/摄影
  '🖼️','📷','📸','🎨','🖌️','🖍️','💿','📀','💽','📼',
];

export default function P2Boards() {
  const [list, setList] = useState([]);
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [filterSec, setFilterSec] = useState('');

  async function load() {
    const [boards, secs] = await Promise.all([getP2Boards(), getP2Sections()]);
    setList(Array.isArray(boards) ? boards : []);
    setSections(Array.isArray(secs) ? secs : []);
  }
  useEffect(() => { load(); }, []);

  function secName(id) { return sections.find(x => x.id === id)?.title || '—'; }
  function openAdd() { setForm({ ...empty, section_id: filterSec || (sections[0]?.id || ''), sort_order: list.length }); setEditing(null); setModal(true); }
  function openEdit(it) { setForm({ ...it }); setEditing(it.id); setModal(true); }
  async function handleSave() {
    if (!form.title.trim() || !form.section_id) { alert('请填标题并选择所属分区'); return; }
    if (editing) await updateP2Board(editing, form); else await createP2Board(form);
    setModal(false); load();
  }
  async function handleDelete(id) {
    if (!confirm('确认删除此子版块？')) return;
    await deleteP2Board(id); load();
  }

  const filtered = filterSec ? list.filter(b => b.section_id === +filterSec) : list;

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={s.hdr}>
        <div>
          <h2 style={s.title}>子版块管理 · 第二页</h2>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>每个子版块带图标、主题/帖数、最后发表、链接</p>
        </div>
        <button style={s.addBtn} onClick={openAdd} disabled={sections.length === 0}>+ 新增子版块</button>
      </div>

      {sections.length === 0 && <div style={s.warn}>请先到「分区管理」创建至少一个分区。</div>}

      <div style={s.filterBar}>
        <select style={s.select} value={filterSec} onChange={e => setFilterSec(e.target.value)}>
          <option value="">全部分区</option>
          {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.title}</option>)}
        </select>
        <span style={s.countBadge}>{filtered.length} 个</span>
      </div>

      <div style={s.table}>
        <div style={s.thead}>
          <span style={{ width: 44 }}>图标</span>
          <span style={{ flex: 1 }}>标题</span>
          <span style={{ width: 110 }}>分区</span>
          <span style={{ width: 120 }}>主题/帖数</span>
          <span style={{ width: 110, textAlign: 'right' }}>操作</span>
        </div>
        {filtered.map(it => (
          <div key={it.id} style={s.row}>
            <span style={{ width: 44 }}>
              {!it.icon ? <span style={{ fontSize: 18 }}>💬</span>
                : /^(\/|https?:|data:)/.test(it.icon) ? <img src={it.icon} alt="" style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'cover' }} /> : <span style={{ fontSize: 22 }}>{it.icon}</span>}
            </span>
            <span style={{ flex: 1, fontWeight: 600 }}>{it.title}{it.badge && <span style={{ color: '#e64340', marginLeft: 4 }}>({it.badge})</span>}</span>
            <span style={{ width: 110, color: '#6b7280', fontSize: 13 }}>{secName(it.section_id)}</span>
            <span style={{ width: 120, color: '#9ca3af', fontSize: 12 }}>{it.threads || 0} / {it.posts || 0}</span>
            <span style={{ width: 110, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <button style={s.editBtn} onClick={() => openEdit(it)}>编辑</button>
              <button style={s.delBtn} onClick={() => handleDelete(it.id)}>删除</button>
            </span>
          </div>
        ))}
        {filtered.length === 0 && <div style={s.empty}>暂无子版块</div>}
      </div>

      {modal && (
        <div style={s.modalBg} onClick={() => setModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>{editing ? '编辑' : '新增'}子版块</h3>
            <div style={s.grid2}>
              <div style={{ marginBottom: 14 }}>
                <label style={s.fieldLabel}>所属分区 *</label>
                <select value={form.section_id || ''} onChange={e => setForm(f => ({ ...f, section_id: +e.target.value }))} style={s.input}>
                  <option value="">选择分区</option>
                  {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.title}</option>)}
                </select>
              </div>
              <Field label="标题 *" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="如 站务公告" />
              <Field label="红色数字角标（可选）" value={form.badge} onChange={v => setForm(f => ({ ...f, badge: v }))} placeholder="如 2" />
              <Field label="主题数" value={form.threads} onChange={v => setForm(f => ({ ...f, threads: v }))} placeholder="如 63 或 3万" />
              <Field label="帖数" value={form.posts} onChange={v => setForm(f => ({ ...f, posts: v }))} placeholder="如 1189" />
              <Field label="最后发表（可选）" value={form.last_post} onChange={v => setForm(f => ({ ...f, last_post: v }))} placeholder="如 2026-5-16 我爱老电影" />
              <Field label="点击跳转链接（可选）" value={form.url} onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="https://..." />
              <Field label="排序" type="number" value={form.sort_order} onChange={v => setForm(f => ({ ...f, sort_order: +v }))} />
            </div>
            <IconField value={form.icon} onChange={v => setForm(f => ({ ...f, icon: v }))} />
            <label style={s.checkLabel}>
              <input type="checkbox" checked={!!form.visible} onChange={e => setForm(f => ({ ...f, visible: e.target.checked ? 1 : 0 }))} />
              <span>显示此子版块</span>
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
      <label style={s.fieldLabel}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={s.input} />
    </div>
  );
}

function IconField({ value, onChange }) {
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
      <label style={s.fieldLabel}>版块图标（图标库点选 / 上传）</label>

      {/* 系统自带图标库 */}
      <div style={s.iconLib}>
        {ICON_LIBRARY.map(em => (
          <button key={em} type="button" onClick={() => onChange(em)}
            style={{ ...s.iconBtn, ...(value === em ? s.iconBtnActive : {}) }}>{em}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {value && (isImg
          ? <img src={value} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid #e5e7eb', flexShrink: 0 }} onError={e => e.target.style.display='none'} />
          : <span style={{ width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{value}</span>)}
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="图标库点选，或填图片URL / 上传" style={{ ...s.input, flex: 1 }} />
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
  modal: { background: '#fff', borderRadius: 14, padding: '28px', width: '100%', maxWidth: 600, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: 17, fontWeight: 700, marginBottom: 20 },
  fieldLabel: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 20, cursor: 'pointer' },
  modalFoot: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { padding: '8px 20px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 14 },
  saveBtn: { padding: '8px 20px', background: 'var(--primary)', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600 },
};
