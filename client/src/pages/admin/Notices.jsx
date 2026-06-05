import React, { useEffect, useState } from 'react';
import { getNotices, createNotice, updateNotice, deleteNotice, getSettings, saveSettings } from '../../api';

const empty = { text: '', url: '', color: '', visible: 1, sort_order: 0 };

export default function Notices() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [speed, setSpeed] = useState('30');
  const [gradOn, setGradOn] = useState(false);
  const [grad1, setGrad1] = useState('#ff6b6b');
  const [grad2, setGrad2] = useState('#4f6ef7');
  const [grad3, setGrad3] = useState('#22c55e');
  const [cfgSaved, setCfgSaved] = useState(false);

  async function load() {
    setList(await getNotices());
    const st = await getSettings();
    setSpeed(st.marquee_speed || '30');
    const g = (st.marquee_gradient || '').split(',');
    if (g[0] && g[1]) {
      setGradOn(true); setGrad1(g[0]); setGrad2(g[1]);
      if (g[2]) setGrad3(g[2]);
    } else setGradOn(false);
  }
  useEffect(() => { load(); }, []);

  async function saveConfig() {
    const gradient = gradOn ? `${grad1},${grad2},${grad3}` : '';
    await saveSettings({ marquee_speed: speed, marquee_gradient: gradient });
    setCfgSaved(true);
    setTimeout(() => setCfgSaved(false), 1500);
  }

  function openAdd() { setForm(empty); setEditing(null); setModal(true); }
  function openEdit(item) { setForm({ ...item }); setEditing(item.id); setModal(true); }

  async function handleSave() {
    if (!form.text.trim()) return;
    if (editing) await updateNotice(editing, form);
    else await createNotice(form);
    setModal(false);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('确认删除此跑马灯？')) return;
    await deleteNotice(id);
    load();
  }

  return (
    <div>
      <div style={s.hdr}>
        <div>
          <h2 style={s.title}>跑马灯管理</h2>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>显示在广告栏上方的滚动公告</p>
        </div>
        <button style={s.addBtn} onClick={openAdd}>+ 新增</button>
      </div>

      {/* 全局配置 */}
      <div style={s.cfgCard}>
        <div style={s.cfgRow}>
          <span style={s.cfgLabel}>滚动速度</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>快</span>
            <input type="range" min="8" max="60" step="1" value={speed}
              onChange={e => setSpeed(e.target.value)} style={{ flex: 1, maxWidth: 260 }} />
            <span style={{ fontSize: 12, color: '#9ca3af' }}>慢</span>
            <span style={{ fontSize: 13, color: '#6b7280', width: 60 }}>{speed} 秒/圈</span>
          </div>
        </div>
        <div style={s.cfgRow}>
          <span style={s.cfgLabel}>文字渐变</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={gradOn} onChange={e => setGradOn(e.target.checked)} />
              <span>开启</span>
            </label>
            {gradOn && (
              <>
                <input type="color" value={grad1} onChange={e => setGrad1(e.target.value)} style={s.gradPicker} />
                <span style={{ color: '#9ca3af' }}>→</span>
                <input type="color" value={grad2} onChange={e => setGrad2(e.target.value)} style={s.gradPicker} />
                <span style={{ color: '#9ca3af' }}>→</span>
                <input type="color" value={grad3} onChange={e => setGrad3(e.target.value)} style={s.gradPicker} />
                <span style={{
                  fontSize: 14, fontWeight: 700,
                  background: `linear-gradient(90deg, ${grad1}, ${grad2}, ${grad3})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>渐变预览效果</span>
              </>
            )}
            {!gradOn && <span style={{ fontSize: 12, color: '#9ca3af' }}>（勾选开启后选择两个颜色）</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={saveConfig} style={s.cfgSaveBtn}>保存配置</button>
          {cfgSaved && <span style={{ color: '#16a34a', fontSize: 13, fontWeight: 600 }}>✅ 已保存</span>}
        </div>
      </div>

      <div style={s.table}>
        <div style={s.thead}>
          <span style={{ flex: 2 }}>文字</span>
          <span style={{ flex: 1 }}>链接</span>
          <span style={{ width: 70, textAlign: 'center' }}>颜色</span>
          <span style={{ width: 70, textAlign: 'center' }}>可见</span>
          <span style={{ width: 120, textAlign: 'right' }}>操作</span>
        </div>
        {list.map(item => (
          <div key={item.id} style={s.row}>
            <span style={{ flex: 2, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.text}</span>
            <span style={{ flex: 1, color: '#6b7280', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.url || '—'}</span>
            <span style={{ width: 70, textAlign: 'center' }}>
              <span style={{ display: 'inline-block', width: 18, height: 18, borderRadius: 4, border: '1px solid #e5e7eb', background: item.color || '#374151' }} />
            </span>
            <span style={{ width: 70, textAlign: 'center' }}>
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
        {list.length === 0 && <div style={s.empty}>暂无跑马灯</div>}
      </div>

      {modal && (
        <div style={s.modalBg} onClick={() => setModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>{editing ? '编辑' : '新增'}跑马灯</h3>
            <Field label="公告文字 *" value={form.text} onChange={v => setForm(f => ({ ...f, text: v }))} placeholder="如：本站新增 100+ 优质资源" />
            <Field label="点击链接（可选）" value={form.url} onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="https://..." />
            <div style={{ marginBottom: 14 }}>
              <label style={s.fieldLabel}>文字颜色</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="color" value={form.color || '#374151'} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
                <input type="text" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="留空用默认"
                  style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14 }} />
              </div>
            </div>
            <Field label="排序" value={form.sort_order} type="number" onChange={v => setForm(f => ({ ...f, sort_order: +v }))} />
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
  cfgCard: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '18px 20px', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 },
  cfgRow: { display: 'flex', alignItems: 'center', gap: 16 },
  cfgLabel: { fontSize: 14, fontWeight: 600, color: '#374151', width: 70, flexShrink: 0 },
  gradPicker: { width: 36, height: 30, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 1 },
  clearGrad: { background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  cfgSaveBtn: { background: 'var(--primary)', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  table: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' },
  thead: { display: 'flex', alignItems: 'center', padding: '10px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280', fontWeight: 600, gap: 8 },
  row: { display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f3f4f6', fontSize: 14, gap: 8 },
  badge: { padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  editBtn: { background: '#eff2ff', color: 'var(--primary)', padding: '5px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600 },
  delBtn: { background: '#fef2f2', color: '#dc2626', padding: '5px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600 },
  empty: { padding: '40px', textAlign: 'center', color: '#9ca3af' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: 14, padding: '28px', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
  modalTitle: { fontSize: 17, fontWeight: 700, marginBottom: 20 },
  fieldLabel: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 20, cursor: 'pointer' },
  modalFoot: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { padding: '8px 20px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 14 },
  saveBtn: { padding: '8px 20px', background: 'var(--primary)', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600 },
};
