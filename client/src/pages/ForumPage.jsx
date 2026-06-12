import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPage2 } from '../api';

function applyTheme(s) {
  const root = document.documentElement;
  if (s.primary_color) root.style.setProperty('--primary', s.primary_color);
  if (s.bg_color) root.style.setProperty('--bg', s.bg_color);
}

// 图标渲染：图片地址 → <img>，否则当 emoji
function Ico({ icon, fallback = '💬', size = 26, imgStyle }) {
  if (!icon) return <span style={{ fontSize: size }}>{fallback}</span>;
  if (/^(\/|https?:|data:)/.test(icon)) return <img src={icon} alt="" style={imgStyle} onError={e => { e.target.style.display = 'none'; }} />;
  return <span style={{ fontSize: size }}>{icon}</span>;
}

export default function ForumPage() {
  const [data, setData] = useState({ sections: [], settings: {}, banners: [], notices: [] });
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  async function load() {
    const d = await fetchPage2();
    setData({ sections: d.sections || [], settings: d.settings || {}, banners: d.banners || [], notices: d.notices || [] });
    applyTheme(d.settings || {});
    setLoading(false);
  }

  useEffect(() => {
    load();
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    let es;
    try { es = new EventSource('/api/events'); es.addEventListener('update', load); } catch {}
    const timer = setInterval(load, 20000);
    return () => { window.removeEventListener('resize', onResize); if (es) es.close(); clearInterval(timer); };
  }, []);

  const { sections, settings, banners, notices } = data;
  if (isMobile) return <MobileView sections={sections} settings={settings} banners={banners} notices={notices} loading={loading} />;
  return <DesktopView sections={sections} settings={settings} loading={loading} />;
}

/* ───────────── 手机版（社区 App 风格）───────────── */
function MobileView({ sections, settings, banners, notices, loading }) {
  const boards = sections.flatMap(s => s.boards.map(b => ({ ...b, secColor: s.color })));
  const posts = sections.flatMap(s => s.posts.map(p => ({ ...p, secColor: s.color })));
  const noticeText = notices.map(n => n.text).join('　|　');

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7', paddingBottom: 64 }}>
      {/* 黄色顶栏 */}
      <header style={m.header}>
        <Link to="/" style={m.brand}>{settings.site_title || '社区'}</Link>
        <div style={m.search}><span style={{ opacity: .5 }}>🔍</span><span style={{ color: '#9aa0a6', fontSize: 13 }}>{settings.search_placeholder || '请输入搜索内容'}</span></div>
        <div style={m.avatarTop}>{settings.site_logo || '🙂'}</div>
      </header>

      {/* 横幅 */}
      {banners[0] && (
        <a href={banners[0].url || undefined} target={banners[0].url ? '_blank' : undefined} rel="noopener noreferrer" style={{ display: 'block' }}>
          <img src={banners[0].image_url} alt="" style={m.banner} />
        </a>
      )}

      {/* 圆形图标导航（子版块） */}
      {boards.length > 0 && (
        <div style={m.iconNav}>
          {boards.slice(0, 10).map(b => {
            const Tag = b.url ? 'a' : 'div';
            return (
              <Tag key={b.id} {...(b.url ? { href: b.url, target: '_blank', rel: 'noopener noreferrer' } : {})} style={m.iconItem}>
                <div style={{ ...m.iconCircle, background: (b.secColor || '#ff9800') }}>
                  <Ico icon={b.icon} fallback="💬" size={24} imgStyle={{ width: 30, height: 30, objectFit: 'cover', borderRadius: '50%' }} />
                </div>
                <span style={m.iconLabel}>{b.title}</span>
              </Tag>
            );
          })}
        </div>
      )}

      {/* 播报（跑马灯） */}
      {noticeText && (
        <div style={m.notice}>
          <span style={m.noticeTag}>📢 新播报</span>
          <div style={m.noticeTrack}><span style={m.noticeText}>{noticeText}</span></div>
        </div>
      )}

      {/* 话题标签（分区） */}
      {sections.length > 0 && (
        <div style={m.tags}>
          {sections.map(sec => (
            <a key={sec.id} href={`#sec-${sec.id}`} style={m.tagChip}>
              <span style={{ ...m.tagDot, background: sec.color || '#ff9800' }} />
              <span style={{ color: sec.color || '#444', fontWeight: 600 }}>#{sec.title}#</span>
            </a>
          ))}
        </div>
      )}

      {/* 信息流（帖子） */}
      <div style={{ background: '#fff', marginTop: 8 }}>
        {loading && <div style={m.tip}>加载中…</div>}
        {!loading && posts.length === 0 && <div style={m.tip}>暂无内容，请在后台「2」中添加子版块/帖子</div>}
        {posts.map(p => {
          const Row = p.url ? 'a' : 'div';
          return (
            <Row key={p.id} {...(p.url ? { href: p.url, target: '_blank', rel: 'noopener noreferrer' } : {})} style={m.feedItem}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={m.feedTitleLine}>
                  {p.tag && <span style={{ ...m.feedTag, background: (p.tag_color || '#ff7a45') + '22', color: p.tag_color || '#ff7a45' }}>{p.tag}</span>}
                  <span style={{ ...m.feedTitle, ...(settings.p2_title_color ? { color: settings.p2_title_color } : {}) }}>{p.title}</span>
                </div>
                <div style={m.feedMeta}>
                  {p.category && <span style={{ color: '#5b8def' }}>{p.category}</span>}
                  {p.author && <span>{p.author}{p.author_vip ? <span style={m.vip}>V</span> : null}</span>}
                  {p.post_time && <span>{p.post_time}</span>}
                  {(p.comments !== '' && p.comments != null) && <span>💬 {p.comments}</span>}
                </div>
              </div>
              {p.avatar && (
                <div style={m.feedThumb}>
                  <Ico icon={p.avatar} fallback="🖼️" size={22} imgStyle={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </Row>
          );
        })}
      </div>

      {/* 底部标签栏 */}
      <nav style={m.tabbar}>
        {[['🏠', '首页', true], ['👥', '社区'], ['⭕', '圈子'], ['💬', '消息'], ['🙂', '我的']].map(([ic, lb, act], i) => (
          <div key={i} style={{ ...m.tab, color: act ? '#ffb300' : '#9aa0a6' }}>
            <span style={{ fontSize: 20 }}>{ic}</span>
            <span style={{ fontSize: 11 }}>{lb}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}

/* ───────────── 电脑版（论坛板块）───────────── */
function DesktopView({ sections, settings, loading }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #eef1f5)' }}>
      <header style={s.header}>
        <div style={s.headerInner}>
          <Link to="/" style={s.logo}>
            <span style={{ fontSize: 24 }}>{settings.site_logo || '🧭'}</span>
            <span style={{ fontWeight: 700 }}>{settings.site_title || '我的导航'}</span>
          </Link>
          <Link to="/" style={s.backTop}>← 返回首页</Link>
        </div>
      </header>

      <div style={s.body}>
        {loading && <div style={s.tip}>加载中…</div>}
        {!loading && sections.length === 0 && (
          <div style={s.tip}>暂无内容，请在后台「2 → 分区管理 / 子版块管理」中添加</div>
        )}

        {sections.map(sec => (
          <div key={sec.id} style={s.section}>
            <div style={{ ...s.secBar, color: sec.color || '#2a6fb0' }}>{sec.title}</div>
            <div className="forum-grid" style={s.grid}>
              {sec.boards.map(b => {
                const inner = (
                  <>
                    <div style={s.ico}><Ico icon={b.icon} fallback="💬" size={26} imgStyle={s.icoImg} /></div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ ...s.tt, ...(settings.p2_title_color ? { color: settings.p2_title_color } : {}) }}>
                        {b.title}
                        {b.badge && <span style={{ ...s.badge, ...(settings.p2_badge_color ? { color: settings.p2_badge_color } : {}) }}>({b.badge})</span>}
                      </p>
                      <p style={s.meta}>
                        主题: <span style={settings.p2_threads_color ? { color: settings.p2_threads_color } : undefined}>{b.threads || 0}</span>, 帖数: <span style={settings.p2_posts_color ? { color: settings.p2_posts_color } : undefined}>{b.posts || 0}</span>
                        {b.last_post ? <><br /><span style={settings.p2_lastpost_color ? { color: settings.p2_lastpost_color } : undefined}>最后发表: {b.last_post}</span></> : null}
                      </p>
                    </div>
                  </>
                );
                return b.url
                  ? <a key={b.id} href={b.url} target="_blank" rel="noopener noreferrer" style={s.board}>{inner}</a>
                  : <div key={b.id} style={s.board}>{inner}</div>;
              })}
              {sec.boards.length === 0 && (!sec.posts || sec.posts.length === 0) && <div style={{ ...s.board, color: '#9ca3af' }}>该分区暂无内容</div>}
            </div>

            {sec.posts && sec.posts.length > 0 && (
              <div style={s.postList}>
                {sec.posts.map(p => {
                  const Row = p.url ? 'a' : 'div';
                  return (
                    <Row key={p.id} {...(p.url ? { href: p.url, target: '_blank', rel: 'noopener noreferrer' } : {})} style={s.post}>
                      <div style={s.avatar}><Ico icon={p.avatar} fallback="👤" size={24} imgStyle={s.avatarImg} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.postTitleLine}>
                          <span style={s.postTitle}>{p.title}</span>
                          {p.tag && <span style={{ ...s.postTag, background: (p.tag_color || '#ff7a45') + '22', color: p.tag_color || '#ff7a45' }}>{p.tag}</span>}
                        </div>
                        <div style={s.postMeta}>
                          {p.category && <span style={s.postCat}>{p.category}</span>}
                          {p.author && <span style={s.postAuthor}>{p.author}{p.author_vip ? <span style={s.vip}>V</span> : null}</span>}
                          {p.post_time && <span>{p.post_time}</span>}
                          {p.last_user && <span style={{ color: '#9aa7b5' }}>↩ {p.last_user} 发表了评论 {p.last_time}</span>}
                        </div>
                      </div>
                      {(p.comments !== '' && p.comments != null) && (
                        <div style={s.commentBox}>💬 {p.comments}</div>
                      )}
                    </Row>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const m = {
  header: { background: '#ffc400', position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' },
  brand: { fontWeight: 800, fontSize: 16, color: '#7a4f00', textDecoration: 'none', flexShrink: 0, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  search: { flex: 1, background: '#fff', borderRadius: 20, height: 34, display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px' },
  avatarTop: { width: 34, height: 34, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
  banner: { width: '100%', display: 'block' },
  iconNav: { background: '#fff', display: 'flex', flexWrap: 'wrap', padding: '14px 6px 4px' },
  iconItem: { width: '20%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 14, textDecoration: 'none', color: '#333' },
  iconCircle: { width: 46, height: 46, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', overflow: 'hidden' },
  iconLabel: { fontSize: 12, color: '#444', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  notice: { background: '#fff7e6', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginTop: 8 },
  noticeTag: { color: '#fa8c16', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  noticeTrack: { flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' },
  noticeText: { display: 'inline-block', fontSize: 13, color: '#8c6d1f', animation: 'p2marquee 18s linear infinite', paddingLeft: '100%' },
  tags: { background: '#fff', marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, padding: 1 },
  tagChip: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', textDecoration: 'none', fontSize: 14, background: '#fff' },
  tagDot: { width: 22, height: 22, borderRadius: 6, flexShrink: 0, display: 'inline-block' },
  feedItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', borderBottom: '1px solid #f1f2f4', textDecoration: 'none', color: '#222' },
  feedTitleLine: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  feedTag: { fontSize: 11, fontWeight: 700, padding: '1px 5px', borderRadius: 3, flexShrink: 0 },
  feedTitle: { fontSize: 15, fontWeight: 600, color: '#222' },
  feedMeta: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 12, color: '#9aa0a6', marginTop: 6 },
  feedThumb: { width: 76, height: 56, borderRadius: 8, background: '#f1f4f8', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  vip: { background: '#f5a623', color: '#fff', borderRadius: '50%', width: 14, height: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, marginLeft: 3 },
  tip: { padding: '40px', textAlign: 'center', color: '#9ca3af' },
  tabbar: { position: 'fixed', bottom: 0, left: 0, right: 0, height: 56, background: '#fff', borderTop: '1px solid #eee', display: 'flex', zIndex: 20 },
  tab: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 },
};

const s = {
  header: { background: '#fff', borderBottom: '1px solid #e3e9f0', position: 'sticky', top: 0, zIndex: 10 },
  headerInner: { maxWidth: 1100, margin: '0 auto', padding: '0 16px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#222' },
  backTop: { fontSize: 13, color: 'var(--primary, #2a6fb0)', textDecoration: 'none' },
  body: { maxWidth: 1100, margin: '0 auto', padding: '16px' },
  tip: { padding: '40px', textAlign: 'center', color: '#9ca3af', background: '#fff', borderRadius: 8, border: '1px solid #e3e9f0' },
  section: { marginBottom: 18, border: '1px solid #e3e9f0', borderRadius: 8, overflow: 'hidden', background: '#fff' },
  secBar: { background: 'linear-gradient(#f3f8fd,#e8f1fa)', borderBottom: '1px solid #dbe6f1', padding: '9px 14px', fontSize: 15, fontWeight: 700 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0 },
  board: { display: 'flex', gap: 12, padding: '14px 16px', textDecoration: 'none', color: '#333', borderRight: '1px solid #eef2f6', borderBottom: '1px solid #eef2f6', transition: '.15s' },
  ico: { width: 50, height: 50, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  icoImg: { width: 50, height: 50, objectFit: 'cover' },
  tt: { fontWeight: 700, color: '#222', margin: '0 0 5px', fontSize: 15 },
  badge: { color: '#e64340', fontWeight: 700, marginLeft: 4, fontSize: 13 },
  meta: { margin: 0, fontSize: 13, color: '#8a90a2', lineHeight: 1.7 },
  postList: { borderTop: '1px solid #eef2f6' },
  post: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #f1f4f8' },
  avatar: { width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: '#f1f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 40, height: 40, objectFit: 'cover' },
  postTitleLine: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  postTitle: { fontSize: 14, fontWeight: 600, color: '#1f2d3d' },
  postTag: { fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 4 },
  postMeta: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 12, color: '#8a90a2', marginTop: 4 },
  postCat: { color: '#5b8def' },
  postAuthor: { display: 'inline-flex', alignItems: 'center', gap: 3, color: '#6b7280' },
  vip: { background: '#f5a623', color: '#fff', borderRadius: '50%', width: 14, height: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 },
  commentBox: { flexShrink: 0, fontSize: 13, color: '#9aa7b5', display: 'flex', alignItems: 'center', gap: 4 },
};
