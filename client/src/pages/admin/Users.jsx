import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUsers, deleteUser, getAdminComments, deleteComment, updateUserColors,
  getSubmissions, approveSubmission, rejectSubmission, deleteSubmission } from '../../api';

export default function Users() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [subs, setSubs] = useState([]);

  function loadUsers() { getUsers().then(d => setUsers(Array.isArray(d) ? d : [])); }
  function loadComments() { getAdminComments().then(d => setComments(Array.isArray(d) ? d : [])); }
  function loadSubs() { getSubmissions().then(d => setSubs(Array.isArray(d) ? d : [])); }
  useEffect(() => { loadUsers(); loadComments(); loadSubs(); }, []);

  function patchUser(id, patch) { setUsers(us => us.map(u => u.id === id ? { ...u, ...patch } : u)); }

  const pendingCount = subs.filter(x => x.status === 'pending').length;
  async function approve(sub) { const r = await approveSubmission(sub.id); if (r.error) return alert(r.error); loadSubs(); }
  async function reject(sub) { const r = await rejectSubmission(sub.id); if (r.error) return alert(r.error); loadSubs(); }
  async function removeSub(sub) { if (!window.confirm('删除这条投稿记录?')) return; const r = await deleteSubmission(sub.id); if (r.error) return alert(r.error); loadSubs(); }

  async function removeUser(u) {
    if (!window.confirm(`确定删除用户「${u.nickname || u.username}」?`)) return;
    const r = await deleteUser(u.id);
    if (r.error) return alert(r.error);
    loadUsers();
  }
  async function removeComment(c) {
    if (!window.confirm('确定删除这条评论?')) return;
    const r = await deleteComment(c.id);
    if (r.error) return alert(r.error);
    loadComments();
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>用户管理</h2>
      <div style={s.tabs}>
        <button style={{ ...s.tab, ...(tab === 'users' ? s.tabActive : {}) }} onClick={() => setTab('users')}>注册用户 ({users.length})</button>
        <button style={{ ...s.tab, ...(tab === 'comments' ? s.tabActive : {}) }} onClick={() => setTab('comments')}>评论 ({comments.length})</button>
        <button style={{ ...s.tab, ...(tab === 'subs' ? s.tabActive : {}) }} onClick={() => setTab('subs')}>
          投稿审核{pendingCount > 0 && <span style={s.dot}>{pendingCount}</span>}
        </button>
      </div>

      {tab === 'subs' && (
        <div style={s.card}>
          {subs.length === 0 && <div style={s.empty}>暂无投稿</div>}
          {subs.map(sub => {
            const st = sub.status === 'approved' ? { t: '已通过', c: '#16a34a', b: '#dcfce7' }
              : sub.status === 'rejected' ? { t: '已拒绝', c: '#dc2626', b: '#fee2e2' }
              : { t: '待审核', c: '#b45309', b: '#fef3c7' };
            return (
              <div key={sub.id} style={s.cmtRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
                    <b style={{ color: '#374151' }}>{sub.nickname || '匿名'}</b>
                    <span style={{ marginLeft: 8 }}>{sub.category_name || '未指定分类'}</span>
                    <span style={{ marginLeft: 8 }}>{String(sub.created_at || '').slice(0, 16)}</span>
                    <span style={{ ...s.badge, marginLeft: 8, background: st.b, color: st.c }}>{st.t}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{sub.title}</div>
                  <a href={sub.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--primary)', wordBreak: 'break-all' }}>{sub.url}</a>
                  {sub.description && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{sub.description}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  {sub.status === 'pending' && <>
                    <button style={s.approveBtn} onClick={() => approve(sub)}>通过</button>
                    <button style={s.rejectBtn} onClick={() => reject(sub)}>拒绝</button>
                  </>}
                  <button style={s.delBtn} onClick={() => removeSub(sub)}>删除</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'users' && (
        <div style={s.card}>
          <div style={{ ...s.row, ...s.head }}>
            <span style={{ width: 40 }}>ID</span>
            <span style={{ flex: 1 }}>用户名</span>
            <span style={{ flex: 1 }}>昵称</span>
            <span style={{ width: 64 }}>角色</span>
            <span style={{ width: 130 }}>昵称色 / 角色色</span>
            <span style={{ width: 120 }}>注册时间</span>
            <span style={{ width: 110, textAlign: 'right' }}>操作</span>
          </div>
          {users.map(u => <UserRow key={u.id} u={u} patchUser={patchUser} removeUser={removeUser} />)}
          {users.length === 0 && <div style={s.empty}>暂无用户</div>}
        </div>
      )}

      {tab === 'comments' && (
        <div style={s.card}>
          {comments.map(c => (
            <div key={c.id} style={s.cmtRow}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
                  <b style={{ color: '#374151' }}>{c.nickname || '匿名'}</b>
                  <span style={{ marginLeft: 8 }}>评论于</span>
                  {c.link_title
                    ? <Link to={`/sites/${c.link_id}`} target="_blank" style={s.linkTag}>📄 {c.link_title}</Link>
                    : <span style={{ marginLeft: 6, color: '#ef4444' }}>链接#{c.link_id}(已删除)</span>}
                  <span style={{ marginLeft: 8 }}>{String(c.created_at || '').slice(0, 16)}</span>
                </div>
                {c.content && <div style={{ fontSize: 14, color: '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{c.content}</div>}
                {c.image_url && <a href={c.image_url} target="_blank" rel="noopener noreferrer"><img src={c.image_url} alt="" style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8, marginTop: 6, border: '1px solid #e5e7eb', display: 'block' }} /></a>}
              </div>
              <button style={s.delBtn} onClick={() => removeComment(c)}>删除</button>
            </div>
          ))}
          {comments.length === 0 && <div style={s.empty}>暂无评论</div>}
        </div>
      )}
    </div>
  );
}

function UserRow({ u, patchUser, removeUser }) {
  const [status, setStatus] = useState('');
  const nick = u.nickname_color || '';
  const role = u.role_color || '';
  const dirtyRef = u._dirty;

  async function save() {
    setStatus('saving');
    try {
      const r = await updateUserColors(u.id, { nickname_color: nick, role_color: role });
      if (r && r.ok) { setStatus('ok'); patchUser(u.id, { _dirty: false }); setTimeout(() => setStatus(''), 1500); }
      else { setStatus('err'); setTimeout(() => setStatus(''), 2000); }
    } catch { setStatus('err'); setTimeout(() => setStatus(''), 2000); }
  }

  const roleIsAdmin = u.role === 'admin';
  return (
    <div style={s.row}>
      <span style={{ width: 40, color: '#9ca3af' }}>{u.id}</span>
      <span style={{ flex: 1, fontWeight: 600 }}>{u.username}</span>
      <span style={{ flex: 1, color: nick || '#374151', fontWeight: nick ? 600 : 400 }}>{u.nickname || (roleIsAdmin ? '管理员' : '—')}</span>
      <span style={{ width: 64 }}>
        <span style={{ ...s.badge,
          background: roleIsAdmin ? '#fef3c7' : '#e0e7ff',
          color: roleIsAdmin ? '#b45309' : (role || '#4338ca') }}>
          {roleIsAdmin ? '管理员' : '用户'}
        </span>
      </span>
      <span style={{ width: 130, display: 'flex', gap: 6 }}>
        <MiniColor value={nick} title="昵称色" onChange={v => patchUser(u.id, { nickname_color: v, _dirty: true })} />
        <MiniColor value={role} title="角色文字色" onChange={v => patchUser(u.id, { role_color: v, _dirty: true })} />
      </span>
      <span style={{ width: 120, color: '#9ca3af', fontSize: 13 }}>{String(u.created_at || '').slice(0, 16)}</span>
      <span style={{ width: 110, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
        {status === 'ok' && <span style={{ fontSize: 13 }}>✅</span>}
        {status === 'err' && <span style={{ fontSize: 11, color: '#dc2626' }}>失败</span>}
        {dirtyRef && <button onClick={save} disabled={status === 'saving'} style={s.saveBtn}>{status === 'saving' ? '…' : '保存'}</button>}
        {!roleIsAdmin && <button style={s.delBtn} onClick={() => removeUser(u)}>删除</button>}
      </span>
    </div>
  );
}

function MiniColor({ value, title, onChange }) {
  const has = value && value.trim();
  return (
    <span title={title} style={{ position: 'relative', display: 'inline-flex' }}>
      <input type="color" value={has ? value : '#888888'} onChange={e => onChange(e.target.value)}
        style={{ width: 26, height: 24, border: '1px solid #e5e7eb', borderRadius: 5, cursor: 'pointer', padding: 1 }} />
      {has && <button onClick={() => onChange('')} title="清除" style={s.miniClear}>✕</button>}
    </span>
  );
}

const s = {
  tabs: { display: 'flex', gap: 6, marginBottom: 16 },
  tab: { padding: '8px 18px', border: '1.5px solid #e5e7eb', background: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#6b7280', cursor: 'pointer' },
  tabActive: { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' },
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid #f3f4f6', fontSize: 14 },
  head: { background: '#f9fafb', fontWeight: 600, color: '#6b7280', fontSize: 13 },
  badge: { display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
  delBtn: { background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  saveBtn: { background: '#eff2ff', color: 'var(--primary)', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  approveBtn: { background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: 6, padding: '5px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  rejectBtn: { background: '#fff7ed', color: '#d97706', border: 'none', borderRadius: 6, padding: '5px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  dot: { display: 'inline-block', marginLeft: 6, minWidth: 16, height: 16, lineHeight: '16px', textAlign: 'center', background: '#ef4444', color: '#fff', borderRadius: 8, fontSize: 11, padding: '0 4px' },
  miniClear: { position: 'absolute', top: -6, right: -6, width: 14, height: 14, lineHeight: '12px', textAlign: 'center', borderRadius: '50%', background: '#111827', color: '#fff', border: 'none', fontSize: 9, cursor: 'pointer', padding: 0 },
  cmtRow: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', borderBottom: '1px solid #f3f4f6' },
  linkTag: { marginLeft: 6, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 },
  empty: { padding: '28px', textAlign: 'center', color: '#9ca3af', fontSize: 14 },
};
