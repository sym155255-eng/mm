import { useEffect, useState } from 'react';
import { settingsApi } from '../../api';

const GRADIENT_OPTIONS = [
  { value: 'rainbow', label: '🌈 彩虹', colors: ['#ff0080','#ff8c00','#ffe600','#00d26a','#00b4d8','#7c3aed'] },
  { value: 'sunset',  label: '🌅 日落', colors: ['#f43f5e','#f97316','#facc15'] },
  { value: 'ocean',   label: '🌊 海洋', colors: ['#06b6d4','#3b82f6','#8b5cf6'] },
  { value: 'forest',  label: '🌿 森林', colors: ['#22c55e','#84cc16','#10b981'] },
  { value: 'candy',   label: '🍭 糖果', colors: ['#ec4899','#a855f7','#6366f1'] },
  { value: 'gold',    label: '✨ 金光', colors: ['#f59e0b','#fde68a','#d97706'] },
];

export default function AdminSettings() {
  const [form, setForm] = useState({
    site_name: '', site_icon: '', site_desc: '', site_footer: '',
    marquee_enabled: 'false', marquee_text: '', marquee_gradient: 'rainbow', marquee_speed: '30',
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsApi.get().then(res => {
      if (res.data) setForm(f => ({ ...f, ...res.data }));
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async e => {
    e.preventDefault();
    await settingsApi.save(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const marqueeOn = form.marquee_enabled === 'true';

  if (loading) return <div className="admin-loading">加载中...</div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">网站设置</h1>
      </div>

      <div className="settings-card">
        <form onSubmit={handleSave}>

          {/* 站点预览 */}
          <div className="settings-preview">
            <div className="preview-logo">
              <span className="preview-icon">{form.site_icon || '🧭'}</span>
              <span className="preview-name">{form.site_name || '导航站'}</span>
            </div>
            <div className="preview-desc">{form.site_desc || '收录优质网站'}</div>
          </div>

          {/* 基本信息 */}
          <div className="settings-section-title">基本信息</div>
          <div className="settings-row">
            <div className="form-group">
              <label>网站名称</label>
              <input className="form-input" value={form.site_name} onChange={e => setForm(f => ({ ...f, site_name: e.target.value }))} placeholder="如：我的导航站" maxLength={30} />
            </div>
            <div className="form-group">
              <label>网站图标（Emoji）</label>
              <input className="form-input" value={form.site_icon} onChange={e => setForm(f => ({ ...f, site_icon: e.target.value }))} placeholder="如：🧭 🌐 🚀 ⭐" maxLength={4} />
            </div>
          </div>
          <div className="form-group">
            <label>网站副标题</label>
            <input className="form-input" value={form.site_desc} onChange={e => setForm(f => ({ ...f, site_desc: e.target.value }))} placeholder="如：收录优质网站，发现互联网精华" maxLength={60} />
          </div>
          <div className="form-group">
            <label>页脚文字</label>
            <input className="form-input" value={form.site_footer} onChange={e => setForm(f => ({ ...f, site_footer: e.target.value }))} placeholder="如：© 2025 导航站 · 收录优质网站" maxLength={80} />
          </div>

          {/* 跑马灯 */}
          <div className="settings-section-title" style={{ marginTop: 24 }}>彩字跑马灯</div>

          <div className="marquee-toggle-row">
            <label className="toggle-label">
              <span>启用跑马灯</span>
              <div
                className={`toggle-switch ${marqueeOn ? 'on' : ''}`}
                onClick={() => setForm(f => ({ ...f, marquee_enabled: marqueeOn ? 'false' : 'true' }))}
              >
                <div className="toggle-thumb" />
              </div>
            </label>
          </div>

          {marqueeOn && (
            <>
              {/* 实时预览 */}
              <div className="marquee-admin-preview">
                <div className="marquee-preview-track">
                  {[form.marquee_text, form.marquee_text].map((t, i) => {
                    const opt = GRADIENT_OPTIONS.find(o => o.value === form.marquee_gradient) || GRADIENT_OPTIONS[0];
                    const bg = `linear-gradient(90deg,${opt.colors.join(',')},${opt.colors[0]})`;
                    return <span key={i} style={{ backgroundImage: bg, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 700, fontSize: '1rem' }}>{t || '（在下方输入跑马灯文字）'}&nbsp;&nbsp;⭐&nbsp;&nbsp;</span>;
                  })}
                </div>
              </div>

              <div className="form-group">
                <label>跑马灯文字</label>
                <input className="form-input" value={form.marquee_text} onChange={e => setForm(f => ({ ...f, marquee_text: e.target.value }))} placeholder="🎉 欢迎使用导航站！✨ 每天更新精选内容 🚀" maxLength={200} />
              </div>

              <div className="form-group">
                <label>颜色主题</label>
                <div className="gradient-picker">
                  {GRADIENT_OPTIONS.map(opt => (
                    <div
                      key={opt.value}
                      className={`gradient-item ${form.marquee_gradient === opt.value ? 'selected' : ''}`}
                      onClick={() => setForm(f => ({ ...f, marquee_gradient: opt.value }))}
                    >
                      <div className="gradient-swatch" style={{ background: `linear-gradient(90deg,${opt.colors.join(',')})` }} />
                      <span>{opt.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>滚动速度：{form.marquee_speed <= 15 ? '慢' : form.marquee_speed <= 35 ? '中' : '快'}</label>
                <div className="speed-row">
                  <span>慢</span>
                  <input type="range" min="5" max="55" step="5" value={form.marquee_speed}
                    onChange={e => setForm(f => ({ ...f, marquee_speed: e.target.value }))}
                    className="speed-slider"
                  />
                  <span>快</span>
                </div>
              </div>
            </>
          )}

          <div className="settings-actions">
            <button type="submit" className="btn-primary">保存设置</button>
            {saved && <span className="save-success">✅ 已保存！刷新首页即可生效</span>}
          </div>

        </form>
      </div>
    </div>
  );
}
