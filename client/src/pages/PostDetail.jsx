import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchP2Post } from '../api';

function applyTheme(s) {
  const root = document.documentElement;
  if (s.primary_color) root.style.setProperty('--primary', s.primary_color);
  if (s.bg_color) root.style.setProperty('--bg', s.bg_color);
}

function Ico({ icon, fallback = '👤', size = 38 }) {
  if (!icon) return <span style={{ fontSize: size }}>{fallback}</span>;
  if (/^(\/|https?:|data:)/.test(icon)) return <img src={icon} alt="" style={{ width: size + 4, height: size + 4, borderRadius: '50%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />;
  return <span style={{ fontSize: size }}>{icon}</span>;
}

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchP2Post(id).then(p => {
      if (!alive) return;
      setPost(p && !p.error ? p : null);
      setSettings(p?.settings || {});
      applyTheme(p?.settings || {});
      setLoading(false);
    });
    return () => { alive = false; };
  }, [id]);

  if (loading) return <div style={s.center}>加载中…</div>;
  if (!post) return (
    <div style={s.center}><p>帖子不存在</p><Link to="/home2" style={{ color: 'var(--primary)' }}>← 返回第二页</Link></div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f4f5f7)' }}>
      <header style={s.header}>
        <div style={s.headerInner}>
          <Link to="/home2" style={s.back}>← 返回</Link>
          <span style={s.headTitle}>主题详情</span>
          <span style={{ width: 40 }} />
        </div>
      </header>

      <div style={s.body}>
        <div style={s.card}>
          <h1 style={s.title}>
            {post.tag && <span style={{ ...s.tag, background: (post.tag_color || '#ff7a45') + '22', color: post.tag_color || '#ff7a45' }}>{post.tag}</span>}
            {post.title}
          </h1>
          <div style={s.metaRow}>
            <div style={s.avatar}><Ico icon={post.avatar} fallback="👤" size={26} /></div>
            <div>
              <div style={s.author}>{post.author || '匿名'}{post.author_vip ? <span style={s.vip}>V</span> : null}</div>
              <div style={s.sub}>{post.category && <span style={{ color: '#5b8def', marginRight: 8 }}>{post.category}</span>}{post.post_time}</div>
            </div>
            {(post.comments !== '' && post.comments != null) && <div style={s.comments}>💬 {post.comments}</div>}
          </div>

          {post.content
            ? <div className="rich-content" style={s.content} dangerouslySetInnerHTML={{ __html: post.content }} />
            : <p style={{ color: '#9ca3af' }}>该帖暂无正文内容</p>}

          {post.url && <a href={post.url} target="_blank" rel="noopener noreferrer" style={s.linkBtn}>查看原文 ›</a>}
        </div>
        <Link to="/home2" style={s.backBtn}>← 返回第二页</Link>
      </div>
    </div>
  );
}

const s = {
  center: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: '#6b7280', background: 'var(--bg)' },
  header: { background: '#fff', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10 },
  headerInner: { maxWidth: 820, margin: '0 auto', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  back: { fontSize: 14, color: 'var(--primary)', textDecoration: 'none', width: 40 },
  headTitle: { fontWeight: 700, fontSize: 15 },
  body: { maxWidth: 820, margin: '0 auto', padding: '16px' },
  card: { background: '#fff', borderRadius: 12, padding: '22px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  title: { fontSize: 21, fontWeight: 700, color: '#1f2d3d', margin: '0 0 16px', lineHeight: 1.5 },
  tag: { fontSize: 12, fontWeight: 700, padding: '2px 7px', borderRadius: 4, marginRight: 8, verticalAlign: 'middle' },
  metaRow: { display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid #f1f2f4' },
  avatar: { width: 40, height: 40, borderRadius: '50%', background: '#f1f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  author: { fontWeight: 600, fontSize: 14, color: '#333', display: 'flex', alignItems: 'center', gap: 4 },
  sub: { fontSize: 12, color: '#9aa0a6', marginTop: 2 },
  vip: { background: '#f5a623', color: '#fff', borderRadius: '50%', width: 14, height: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 },
  comments: { marginLeft: 'auto', fontSize: 13, color: '#9aa7b5' },
  content: { fontSize: 15, color: '#333', lineHeight: 1.85, wordBreak: 'break-word' },
  linkBtn: { display: 'inline-block', marginTop: 18, background: 'var(--primary)', color: '#fff', padding: '10px 22px', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' },
  backBtn: { display: 'inline-block', marginTop: 16, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 20px', fontSize: 14, color: '#374151', textDecoration: 'none' },
};
