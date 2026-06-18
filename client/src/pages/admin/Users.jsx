import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUsers, deleteUser, getAdminComments, deleteComment } from '../../api';

export default function Users() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);

  function loadUsers() { getUsers().then(d => setUsers(Array.isArray(d) ? d : [])); }
  function loadComments() { getAdminComments().then(d => setComments(Array.isArray(d) ? d : [])); }
  useEffect(() => { loadUsers(); loadComments(); }, []);

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
      </div>

      {tab === 'users' && (
        <div style={s.card}>
          <div style={{ ...s.row, ...s.head }}>
            <span style={{ width: 50 }}>ID</span>
            <span style={{ flex: 1 }}>用户名</span>
            <span style={{ flex: 1 }}>昵称</span>
            <span style={{ width: 70 }}>角色</span>
            <span style={{ width: 150 }}>注册时间</span>
            <span style={{ width: 70 }}>操作</span>
          </div>
          {users.map(u => (
            <div key={u.id} style={s.row}>
              <span style={{ width: 50, color: '#9ca3af' }}>{u.id}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>{u.username}</span>
              <span style={{ flex: 1, color: '#6b7280' }}>{u.nickname || '—'}</span>
              <span style={{ width: 70 }}>
                <span style={{ ...s.badge, background: u.role === 'admin' ? '#fef3c7' : '#e0e7ff', color: u.role === 'admin' ? '#b45309' : '#4338ca' }}>
                  {u.role === 'admin' ? '管理员' : '用户'}
                </span>
              </span>
              <span style={{ width: 150, color: '#9ca3af', fontSize: 13 }}>{String(u.created_at || '').slice(0, 16)}</span>
              <span style={{ width: 70 }}>
                {u.role !== 'admin' && <button style={s.delBtn} onClick={() => removeUser(u)}>删除</button>}
              </span>
            </div>
          ))}
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

const s = {
  tabs: { display: 'flex', gap: 6, marginBottom: 16 },
  tab: { padding: '8px 18px', border: '1.5px solid #e5e7eb', background: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#6b7280', cursor: 'pointer' },
  tabActive: { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' },
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid #f3f4f6', fontSize: 14 },
  head: { background: '#f9fafb', fontWeight: 600, color: '#6b7280', fontSize: 13 },
  badge: { display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
  delBtn: { background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  cmtRow: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', borderBottom: '1px solid #f3f4f6' },
  linkTag: { marginLeft: 6, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 },
  empty: { padding: '28px', textAlign: 'center', color: '#9ca3af', fontSize: 14 },
};
