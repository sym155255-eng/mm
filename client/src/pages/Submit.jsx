import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { fetchPublicData, submitContribution, getMySubmissions } from '../api';

const STATUS = {
  pending:  { text: '待审核', color: '#b45309', bg: '#fef3c7' },
  approved: { text: '已通过', color: '#16a34a', bg: '#dcfce7' },
  rejected: { text: '已拒绝', color: '#dc2626', bg: '#fee2e2' },
};

export default function Submit() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState({ title: '', url: '', description: '', category_id: '' });
  const [mine, setMine] = useState([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!user) nav('/login', { replace: true }); }, [user, nav]);

  function loadMine() { getMySubmissions().then(d => setMine(Array.isArray(d) ? d : [])); }
  useEffect(() => {
    fetchPublicData().then(d => setCats(d.categories || []));
    loadMine();
  }, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit() {
    setErr(''); setMsg('');
    if (!form.title.trim()) { setErr('请填写标题'); return; }
    if (!/^https?:\/\//i.test(form.url.trim())) { setErr('请填写正确的网址（http/https）'); return; }
    setLoading(true);
    try {
      const r = await submitContribution(form);
      if (r.error) { setErr(r.error); return; }
      setMsg('投稿成功，等待管理员审核');
      setForm({ title: '', url: '', description: '', category_id: '' });
      loadMine();
    } catch { setErr('提交失败，请稍后重试'); }
    finally { setLoading(false); }
  }

  if (!user) return null;

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.headerInner}>
          <Link to="/" style={s.logo}>🧭 <span style={{ fontWeight: 700 }}>投稿</span></Link>
          <Link to="/" style={s.back}>← 返回</Link>
        </div>
      </header>

      <div style={s.body}>
        <div style={s.card}>
          <div style={s.cardTitle}>提交网站收录</div>
          <p style={s.hint}>提交后需管理员审核通过才会发布。</p>

          <label style={s.label}>网站标题 *</label>
          <input style={s.input} value={form.title} onChange={e => set('title', e.target.value)} placeholder="例如：GitHub" />

          <label style={s.label}>网址 *</label>
          <input style={s.input} value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://..." />

          <label style={s.label}>分类</label>
          <select style={s.input} value={form.category_id} onChange={e => set('category_id', e.target.value)}>
            <option value="">不指定（由管理员归类）</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>

          <label style={s.label}>描述</label>
          <textarea style={{ ...s.input, minHeight: 70, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="一句话介绍这个网站（选填）" />

          {err && <div style={s.err}>{err}</div>}
          {msg && <div style={s.ok}>{msg}</div>}
          <button style={{ ...s.btn, ...(loading ? { opacity: 0.6 } : {}) }} onClick={submit} disabled={loading}>
            {loading ? '提交中…' : '提交投稿'}
          </button>
        </div>

        {/* 我的投稿 */}
        <div style={{ ...s.card, marginTop: 14 }}>
          <div style={s.cardTitle}>我的投稿 ({mine.length})</div>
          {mine.length === 0 && <div style={{ color: '#9ca3af', fontSize: 14, padding: '8px 0' }}>还没有投稿</div>}
          {mine.map(m => {
            const st = STATUS[m.status] || STATUS.pending;
            return (
              <div key={m.id} style={s.mineRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{m.category_name || '未指定'} · {String(m.created_at || '').slice(0, 16)}</div>
                </div>
                <span style={{ ...s.badge, background: st.bg, color: st.color }}>{st.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg)' },
  header: { background: '#fff', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10 },
  headerInner: { maxWidth: 600, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'var(--text)' },
  back: { background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '6px 14px', fontSize: 14, fontWeight: 600, color: '#374151', textDecoration: 'none' },
  body: { maxWidth: 600, margin: '0 auto', padding: '20px 16px 80px' },
  card: { background: '#fff', borderRadius: 14, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  cardTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 },
  hint: { fontSize: 13, color: '#9ca3af', marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', margin: '12px 0 6px' },
  input: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  err: { background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginTop: 14 },
  ok: { background: '#dcfce7', color: '#16a34a', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginTop: 14 },
  btn: { width: '100%', marginTop: 16, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  mineRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid #f3f4f6' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, flexShrink: 0 },
};
