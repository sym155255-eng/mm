import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchLinkDetail, fetchPublicData, fetchComments, postComment, uploadCommentImage, fetchCaptcha, recordVisit } from '../api';
import Avatar from '../components/Avatar';

function applyTheme(s) {
  const root = document.documentElement;
  if (s.primary_color) root.style.setProperty('--primary', s.primary_color);
  if (s.bg_color) root.style.setProperty('--bg', s.bg_color);
}

export default function SiteDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [link, setLink] = useState(null);
  const [settings, setSettings] = useState({});
  const [banners, setBanners] = useState([]);
  const [notices, setNotices] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([fetchLinkDetail(id), fetchPublicData()]).then(([l, d]) => {
      if (!alive) return;
      setLink(l && !l.error ? l : null);
      setSettings(d.settings || {});
      setBanners(d.banners || []);
      setNotices(d.notices || []);
      setAds((d.ads || []).filter(a => a.position === 'top'));
      applyTheme(d.settings || {});
      setLoading(false);
    });
    return () => { alive = false; };
  }, [id]);

  useEffect(() => { recordVisit(); }, [id]);

  function openSite() {
    if (link?.url) window.open(link.url, '_blank', 'noopener,noreferrer');
  }

  if (loading) return <div style={s.center}>加载中…</div>;
  if (!link) return (
    <div style={s.center}>
      <p>链接不存在或已删除</p>
      <Link to="/" style={s.backLink}>← 返回首页</Link>
    </div>
  );

  const icon = link.icon || `https://www.google.com/s2/favicons?domain=${link.url}&sz=64`;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* 顶栏 */}
      <header className="detail-header" style={s.header}>
        <div style={{ ...s.headerInner, justifyContent: 'space-between' }}>
          <Link to="/" style={s.logo}>
            <span style={{ fontSize: 24 }}>{settings.site_logo || '🧭'}</span>
            <span style={{ fontWeight: 700 }}>{settings.site_title || '我的导航'}</span>
          </Link>
          <button className="detail-header-back" onClick={() => nav(-1)} style={s.headerBack}>← 返回</button>
        </div>
      </header>

      <div style={s.body}>
        {/* 横幅图片 */}
        {banners.length > 0 && (
          <div className="banner-wrap" style={s.bannerWrap}>
            {banners.map(b => (
              b.url
                ? <a key={b.id} href={b.url} target="_blank" rel="noopener noreferrer"><img src={b.image_url} alt="" style={s.bannerImg} /></a>
                : <img key={b.id} src={b.image_url} alt="" style={s.bannerImg} />
            ))}
          </div>
        )}

        {/* 跑马灯 */}
        {notices.length > 0 && (() => {
          const speed = parseFloat(settings.marquee_speed) || 30;
          const grad = settings.marquee_gradient;
          const gradOn = grad && grad.includes(',');
          const colors = gradOn ? grad.split(',') : [];
          const gradStr = gradOn ? `linear-gradient(90deg, ${[...colors, colors[0]].join(', ')})` : '';
          const gradVars = gradOn ? { '--grad': gradStr } : {};
          let base = [...notices];
          while (base.length < 12) base = [...base, ...notices];
          const loopItems = [...base, ...base];
          return (
            <div className="marquee-neon" style={s.marquee}>
              <div style={s.marqueeViewport}>
                <div className="marquee-track" style={{ ...s.marqueeTrack, animationDuration: `${speed}s` }}>
                  {loopItems.map((n, i) => {
                    const itemStyle = { ...s.marqueeItem, ...gradVars, ...(gradOn ? {} : { color: n.color || '#facc15' }) };
                    const cls = gradOn ? 'marquee-grad' : '';
                    return n.url
                      ? <a key={i} className={cls} href={n.url} target="_blank" rel="noopener noreferrer" style={itemStyle}>{n.text}</a>
                      : <span key={i} className={cls} style={itemStyle}>{n.text}</span>;
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* 广告 */}
        {settings.show_ads === '1' && ads.length > 0 && (
          <div style={s.adsWrap}>
            <div style={s.adsHeader}>
              <div style={s.adsHeaderLeft}>
                <span style={s.adsDot} />
                <span style={s.adsTitle}>{settings.ads_section_title || '精品推荐 / 赞助合作商'}</span>
              </div>
            </div>
            <div className={`ads-row${settings.mobile_ad_style === '2' ? ' ad-circle' : ''}${ads.length >= 10 ? ' ad-c5' : ' ad-c4'}`} style={s.adsRow}>
              {ads.map(ad => (
                <a key={ad.id} className="ad-card" href={ad.url || '#'} target="_blank" rel="noopener noreferrer" style={s.adCard}>
                  {ad.badge && (
                    <span style={{ ...s.adBadge, background: ad.badge_color || 'var(--badge)' }}>{ad.badge}</span>
                  )}
                  <div className="ad-ic" style={s.adCardIcon}>
                    {ad.image_url
                      ? <img src={ad.image_url} alt={ad.title} style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'contain' }} />
                      : <span style={{ fontSize: 18 }}>📢</span>}
                  </div>
                  <div className="ad-tx" style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...s.adCardTitle, ...(ad.title_color ? { color: ad.title_color } : {}) }}>{ad.title}</div>
                    {ad.description && (
                      <div style={{ ...s.adCardDesc, ...(ad.desc_color ? { color: ad.desc_color } : {}) }}>{ad.description}</div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 面包屑 */}
        <div style={s.crumb}>
          <Link to="/" style={s.crumbLink}>🏠 首页</Link>
          {link.category_name && <><span style={s.sep}>·</span><span>{link.category_name}</span></>}
          {link.sub_category_name && <><span style={s.sep}>·</span><span>{link.sub_category_name}</span></>}
          <span style={s.sep}>·</span><span style={{ color: '#9ca3af' }}>正文</span>
        </div>

        {/* 卡片 */}
        <div style={s.card}>
          <div className="detail-title-row" style={{ ...s.titleRow, flexWrap: 'wrap' }}>
            <img className="detail-icon" src={icon} alt="" style={s.icon} onError={e => e.target.style.visibility = 'hidden'} />
            <h1 className="detail-h1" style={s.title}>{link.title}</h1>
            {link.category_name && (
              <span className="detail-tag" style={s.tag}>📁 {link.sub_category_name || link.category_name}</span>
            )}
            <button className="detail-open-btn" style={s.openBtn} onClick={openSite}>打开网站 ›</button>
            {/* 子链接：与标题同一行；移动端单独占一行横向排列 */}
            {link.sub_links && link.sub_links.length > 0 && (
              <div className="detail-sub-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {link.sub_links.map(sl => (
                  <a key={sl.id} className="detail-sub-link" href={sl.url} target="_blank" rel="noopener noreferrer" style={s.subLink}>
                    🔗 {sl.title}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div style={s.meta}>
            <span>👁 {link.views || 0} 次浏览</span>
            {link.created_at && <span>🕒 收录于 {String(link.created_at).slice(0, 10)}</span>}
          </div>

          {link.description && <p style={{ ...s.desc, ...(link.desc_gradient ? { backgroundImage: link.desc_gradient, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent', fontWeight: 700, animation: 'gradFlow 3s linear infinite' } : {}) }}>{link.description}</p>}
        </div>

        {/* 评论区 */}
        <CommentSection linkId={link.id} />
      </div>
    </div>
  );
}

function CommentSection({ linkId }) {
  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE = 20;
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');     // 已上传的图片路径
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [captcha, setCaptcha] = useState({ token: '', svg: '' });
  const fileRef = React.useRef(null);

  const authUser = (() => { try { return JSON.parse(localStorage.getItem('nav_user')); } catch { return null; } })();
  const isLoggedIn = !!localStorage.getItem('nav_token') && !!authUser;

  function loadComments() {
    fetchComments(linkId, 0, PAGE).then(d => {
      setComments(Array.isArray(d.items) ? d.items : []);
      setTotal(d.total || 0);
    });
  }
  async function loadMore() {
    setLoadingMore(true);
    try {
      const d = await fetchComments(linkId, comments.length, PAGE);
      setComments(prev => [...prev, ...(d.items || [])]);
      setTotal(d.total || 0);
    } finally { setLoadingMore(false); }
  }
  function loadCaptcha() {
    fetchCaptcha().then(d => { setCaptcha(d); setCaptchaText(''); });
  }
  useEffect(() => { loadComments(); }, [linkId]);
  useEffect(() => { if (isLoggedIn) loadCaptcha(); }, [isLoggedIn]);

  async function onPickImage(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErr('请选择图片文件'); return; }
    if (file.size > 5 * 1024 * 1024) { setErr('图片不能超过 5MB'); return; }
    setErr(''); setUploading(true);
    try {
      const r = await uploadCommentImage(file);
      if (r.error || !r.path) { setErr(r.error || '图片上传失败'); return; }
      setImage(r.path);
    } catch {
      setErr('图片上传失败');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function submit() {
    setErr('');
    if (!content.trim() && !image) { setErr('请输入评论内容或添加图片'); return; }
    if (!captchaText.trim()) { setErr('请输入图形验证码'); return; }
    setSubmitting(true);
    try {
      const r = await postComment({ link_id: linkId, content, image_url: image, captcha_token: captcha.token, captcha_text: captchaText });
      if (r.error) { setErr(r.error); loadCaptcha(); return; }
      setContent(''); setImage('');
      setComments(prev => [r, ...prev]);
      setTotal(t => t + 1);
      loadCaptcha();
    } catch {
      setErr('提交失败，请稍后重试'); loadCaptcha();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div id="comment-box" style={s.cmtCard}>
      <div style={s.cmtTitle}>评论 <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: 13 }}>({total})</span></div>

      {/* 评论列表 */}
      <div style={{ marginBottom: 8 }}>
        {comments.length === 0 && <div style={{ color: '#9ca3af', fontSize: 14, padding: '12px 0' }}>暂无评论，快来抢沙发吧～</div>}
        {comments.map(c => {
          const name = c.role === 'admin' ? '管理员' : (c.nickname || '匿名');
          return (
          <div key={c.id} style={s.cmtItem}>
            <div style={s.cmtItemHead}>
              <Avatar seed={'c' + c.id} size={28} />
              <span style={{ ...s.cmtName, ...(c.nickname_color ? { color: c.nickname_color } : {}) }}>{name}</span>
              <span style={s.cmtTime}>{String(c.created_at || '').slice(0, 16)}</span>
            </div>
            {c.content && <div style={s.cmtContent}>{c.content}</div>}
            {c.image_url && (
              <div style={{ paddingLeft: 36, marginTop: c.content ? 8 : 4 }}>
                <a href={c.image_url} target="_blank" rel="noopener noreferrer">
                  <img src={c.image_url} alt="评论图片" style={s.cmtImg} />
                </a>
              </div>
            )}
          </div>
          );
        })}
        {comments.length < total && (
          <button onClick={loadMore} disabled={loadingMore} style={s.cmtMoreBtn}>
            {loadingMore ? '加载中…' : `加载更多评论（剩 ${total - comments.length}）`}
          </button>
        )}
      </div>

      {/* 发表表单（需登录） */}
      <div style={s.cmtFormWrap}>
        {isLoggedIn ? (
          <>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>以 <b style={{ color: '#374151' }}>{authUser.role === 'admin' ? '管理员' : (authUser.nickname || authUser.username)}</b> 身份发表</div>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="输入评论内容…" style={s.cmtTextarea} />
            {image && (
              <div style={s.cmtPreviewWrap}>
                <img src={image} alt="预览" style={s.cmtPreviewImg} />
                <button type="button" onClick={() => setImage('')} style={s.cmtPreviewDel} title="移除图片">✕</button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} style={{ display: 'none' }} />
            <div style={s.cmtToolRow}>
              <button type="button" onClick={() => fileRef.current && fileRef.current.click()} disabled={uploading} style={s.cmtImgBtn}>
                {uploading ? '上传中…' : '🖼️ 图片'}
              </button>
              <div style={s.cmtCaptchaBox}>
                <input value={captchaText} onChange={e => setCaptchaText(e.target.value)} placeholder="验证码" style={s.cmtCaptchaInput} />
                {captcha.svg && <img src={captcha.svg} alt="验证码" title="点击刷新" onClick={loadCaptcha} style={s.cmtCaptchaImg} />}
              </div>
              <button onClick={submit} disabled={submitting || uploading} style={{ ...s.cmtSubmitBtn, marginLeft: 'auto', ...((submitting || uploading) ? { opacity: 0.6, cursor: 'default' } : {}) }}>
                {submitting ? '提交中…' : '发表评论'}
              </button>
            </div>
            {err && <div style={s.cmtErr}>{err}</div>}
          </>
        ) : (
          <div style={s.cmtLoginTip}>
            <span>登录后即可发表评论</span>
            <Link to="/login" style={s.cmtLoginBtn}>登录 / 注册</Link>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  center: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: '#6b7280', background: 'var(--bg)' },
  backLink: { color: 'var(--primary)', textDecoration: 'none' },
  header: { background: '#fff', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10 },
  headerInner: { maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center' },
  logo: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--text)' },
  body: { maxWidth: 1100, margin: '0 auto', padding: '16px 16px 40px' },
  crumb: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 13, color: '#6b7280', marginBottom: 14 },
  crumbLink: { color: 'var(--primary)', textDecoration: 'none' },
  sep: { color: '#d1d5db' },
  card: { background: '#fff', borderRadius: 14, padding: '16px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  titleRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 },
  icon: { width: 44, height: 44, borderRadius: 10, objectFit: 'contain', background: '#f5f5f5', flexShrink: 0 },
  title: { fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 },
  meta: { display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13, color: '#9ca3af', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' },
  desc: { fontSize: 15, color: '#374151', lineHeight: 1.7, marginBottom: 20 },
  openBtn: { background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'block' },
  tag: { display: 'inline-block', background: '#eff2ff', color: 'var(--primary)', padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500 },
  subLink: { padding: '10px 20px', background: '#f7f8fa', borderRadius: 20, textDecoration: 'none', color: 'var(--primary)', fontSize: 15, whiteSpace: 'nowrap' },
  headerBack: { background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '6px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#374151', flexShrink: 0 },
  // 横幅
  bannerWrap: { display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 10, borderRadius: 10, overflow: 'hidden' },
  bannerImg: { width: '100%', height: 'auto', display: 'block' },
  // 跑马灯
  marquee: { display: 'flex', alignItems: 'center', gap: 12, background: 'linear-gradient(135deg, #1e1b2e, #2d2640)', border: '2px solid #a855f7', borderRadius: 999, padding: '6px 16px', marginBottom: 10, overflow: 'hidden' },
  marqueeViewport: { flex: 1, overflow: 'hidden', position: 'relative' },
  marqueeTrack: { display: 'flex', width: 'max-content', gap: 48, whiteSpace: 'nowrap', willChange: 'transform' },
  marqueeItem: { fontSize: 14, fontWeight: 700, textDecoration: 'none' },
  // 广告
  adsWrap: { background: '#fff', borderRadius: 16, border: '1px solid #f0e6c8', padding: '20px 28px 22px', marginBottom: 10 },
  adsHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  adsHeaderLeft: { display: 'flex', alignItems: 'center', gap: 7 },
  adsDot: { width: 9, height: 9, borderRadius: '50%', background: '#f59e0b', flexShrink: 0, boxShadow: '0 0 0 2px #fde68a' },
  adsTitle: { fontSize: 13, fontWeight: 700, color: '#78350f' },
  adsRow: { display: 'grid', gap: 16 },
  adCard: { display: 'flex', alignItems: 'center', gap: 12, position: 'relative', background: 'var(--ad-bg, #fff)', border: '1.5px solid var(--ad-border)', borderRadius: 10, padding: '10px 14px', textDecoration: 'none', cursor: 'pointer', minWidth: 0 },
  adCardIcon: { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fffbeb', borderRadius: 8, flexShrink: 0 },
  adCardTitle: { fontSize: 13, fontWeight: 700, color: 'var(--ad-title, #1a1a2e)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  adCardDesc: { fontSize: 11, color: 'var(--ad-desc, #6b7280)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 },
  adBadge: { position: 'absolute', top: 6, right: 6, color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, lineHeight: 1.5, zIndex: 1 },
  // 评论
  cmtCard: { background: '#fff', borderRadius: 14, padding: '14px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginTop: 8 },
  cmtTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 },
  cmtFormWrap: { marginTop: 14, paddingTop: 16, borderTop: '1px solid #f3f4f6' },
  cmtTextarea: { width: '100%', boxSizing: 'border-box', minHeight: 90, resize: 'vertical', border: 'none', background: '#f3f4f6', borderRadius: 10, padding: '12px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  cmtSubmitRow: { display: 'flex', gap: 10, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' },
  cmtSubmitBtn: { background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 26px', fontSize: 15, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },
  cmtImgBtn: { background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, padding: '11px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  cmtToolRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  cmtCaptchaBox: { display: 'flex', alignItems: 'center', gap: 8, background: '#f3f4f6', borderRadius: 10, padding: '4px 6px 4px 12px' },
  cmtCaptchaInput: { width: 80, border: 'none', background: 'transparent', fontSize: 14, outline: 'none' },
  cmtCaptchaImg: { height: 38, borderRadius: 6, cursor: 'pointer', flexShrink: 0 },
  cmtPreviewWrap: { position: 'relative', display: 'inline-block', marginTop: 10 },
  cmtPreviewImg: { maxWidth: 160, maxHeight: 160, borderRadius: 10, display: 'block', border: '1px solid #e5e7eb' },
  cmtPreviewDel: { position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', background: '#111827', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer', lineHeight: 1 },
  cmtImg: { maxWidth: 240, maxHeight: 240, borderRadius: 10, border: '1px solid #e5e7eb', display: 'block', cursor: 'zoom-in' },
  cmtMoreBtn: { width: '100%', marginTop: 6, padding: '10px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  cmtLoginTip: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', background: '#f9fafb', border: '1px dashed #e5e7eb', borderRadius: 10, padding: '14px 18px', color: '#6b7280', fontSize: 14 },
  cmtLoginBtn: { background: 'var(--primary)', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 14, fontWeight: 600 },
  cmtErr: { color: '#ef4444', fontSize: 13, marginTop: 8 },
  cmtItem: { padding: '8px 0', borderTop: '1px solid #f3f4f6' },
  cmtItemHead: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 },
  cmtAvatar: { width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, textTransform: 'uppercase' },
  cmtName: { fontSize: 14, fontWeight: 600, color: '#374151' },
  cmtTime: { fontSize: 12, color: '#9ca3af', marginLeft: 'auto' },
  cmtContent: { fontSize: 14, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', paddingLeft: 36 },
};
