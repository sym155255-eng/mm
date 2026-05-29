import { useEffect, useState } from 'react';
import { adsApi } from '../../api';

const BADGE_COLORS = [
  { label: '紫', value: '#6366f1' },
  { label: '红', value: '#ef4444' },
  { label: '橙', value: '#f97316' },
  { label: '绿', value: '#22c55e' },
  { label: '蓝', value: '#3b82f6' },
  { label: '粉', value: '#ec4899' },
];

const BG_PRESETS = [
  { label: '无', value: '' },
  { label: '浅紫', value: '#f5f3ff' },
  { label: '浅蓝', value: '#eff6ff' },
  { label: '浅绿', value: '#f0fdf4' },
  { label: '浅橙', value: '#fff7ed' },
  { label: '浅粉', value: '#fdf2f8' },
  { label: '浅灰', value: '#f8fafc' },
];

const emptyForm = {
  title: '', description: '', badge: '', badge_color: '#6366f1',
  link: '', columns: 1, bg_color: '', sort: 0, enabled: 1,
};

function AdModal({ ad, onSave, onClose }) {
  const [form, setForm] = useState(ad ? {
    title: ad.title, description: ad.description || '', badge: ad.badge || '',
    badge_color: ad.badge_color || '#6366f1', link: ad.link || '',
    columns: ad.columns || 1, bg_color: ad.bg_color || '',
    sort: ad.sort ?? 0, enabled: ad.enabled ?? 1,
  } : { ...emptyForm });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    await onSave(form);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{ad ? '编辑广告' : '添加广告'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>标题 *</label>
            <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>文字描述</label>
            <textarea className="form-input" value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="广告说明文字" />
          </div>
          <div className="form-group">
            <label>角标文字 <span className="label-hint">（留空不显示）</span></label>
            <input className="form-input" value={form.badge} onChange={e => set('badge', e.target.value)} placeholder="如：限时 / 新品 / HOT" maxLength={6} />
          </div>
          <div className="form-group">
            <label>角标颜色</label>
            <div className="ads-badge-colors">
              {BADGE_COLORS.map(c => (
                <div
                  key={c.value}
                  className={`ads-badge-dot ${form.badge_color === c.value ? 'active' : ''}`}
                  style={{ background: c.value }}
                  title={c.label}
                  onClick={() => set('badge_color', c.value)}
                />
              ))}
              <input type="color" className="color-picker-input" value={form.badge_color}
                onChange={e => set('badge_color', e.target.value)} title="自定义" />
            </div>
          </div>
          <div className="form-group">
            <label>跳转链接 <span className="label-hint">（留空不跳转）</span></label>
            <input className="form-input" value={form.link} onChange={e => set('link', e.target.value)} placeholder="https://" />
          </div>
          <div className="ads-row-2">
            <div className="form-group">
              <label>宽度</label>
              <div className="ads-cols-picker">
                <div className={`ads-col-btn ${form.columns === 1 ? 'active' : ''}`} onClick={() => set('columns', 1)}>
                  <div className="ads-col-icon col1"><span /><span /></div>
                  <span>半宽（1列）</span>
                </div>
                <div className={`ads-col-btn ${form.columns === 2 ? 'active' : ''}`} onClick={() => set('columns', 2)}>
                  <div className="ads-col-icon col2"><span /></div>
                  <span>全宽（2列）</span>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>背景色</label>
              <div className="ads-bg-picker">
                {BG_PRESETS.map(b => (
                  <div
                    key={b.value}
                    className={`ads-bg-swatch ${form.bg_color === b.value ? 'active' : ''}`}
                    style={{ background: b.value || '#fff', border: b.value ? `2px solid ${b.value === form.bg_color ? '#6366f1' : '#e2e8f0'}` : '2px dashed #cbd5e1' }}
                    title={b.label}
                    onClick={() => set('bg_color', b.value)}
                  />
                ))}
                <input type="color" className="color-picker-input" value={form.bg_color || '#ffffff'}
                  onChange={e => set('bg_color', e.target.value)} title="自定义背景色" />
              </div>
            </div>
          </div>
          <div className="ads-row-2">
            <div className="form-group">
              <label>排序值 <span className="label-hint">（小的在前）</span></label>
              <input className="form-input" type="number" value={form.sort} onChange={e => set('sort', parseInt(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label>状态</label>
              <div className="ads-enabled-row">
                <div
                  className={`toggle-switch ${form.enabled ? 'on' : ''}`}
                  onClick={() => set('enabled', form.enabled ? 0 : 1)}
                ><div className="toggle-thumb" /></div>
                <span>{form.enabled ? '已启用' : '已禁用'}</span>
              </div>
            </div>
          </div>

          {/* 实时预览 */}
          <div className="form-group">
            <label>预览效果</label>
            <div className="ad-card-preview" style={{ background: form.bg_color || '#f8fafc', gridColumn: form.columns === 2 ? 'span 2' : 'span 1' }}>
              <div className="ad-title-row">
                <span className="ad-title">{form.title || '广告标题'}</span>
                {form.badge && (
                  <span className="ad-badge" style={{ '--ad-badge-bg': form.badge_color }}>{form.badge}</span>
                )}
              </div>
              {form.description && <div className="ad-desc">{form.description}</div>}
              {form.link && <div className="ad-link-hint">🔗 {form.link}</div>}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
            <button type="submit" className="btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminAds() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editAd, setEditAd] = useState(null);

  const load = () => {
    setLoading(true);
    adsApi.getAll().then(res => setAds(res.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async form => {
    try {
      if (editAd) await adsApi.update(editAd.id, form);
      else await adsApi.create(form);
      load();
    } catch (err) {
      alert(err.message || '保存失败');
      throw err;
    }
  };

  const handleDelete = async id => {
    if (!confirm('确认删除该广告？')) return;
    await adsApi.delete(id);
    load();
  };

  const toggleEnabled = async ad => {
    await adsApi.update(ad.id, { ...ad, enabled: ad.enabled ? 0 : 1 });
    load();
  };

  const openCreate = () => { setEditAd(null); setShowModal(true); };
  const openEdit = ad => { setEditAd(ad); setShowModal(true); };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">广告栏</h1>
          <p className="admin-page-sub">展示在首页跑马灯下方，支持1列/2列宽度，含角标和描述</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ 添加广告</button>
      </div>

      {loading ? <div className="admin-loading">加载中...</div> : ads.length === 0 ? (
        <div className="ads-empty">
          <div className="ads-empty-icon">📢</div>
          <p>暂无广告，点击右上角添加</p>
        </div>
      ) : (
        <div className="ads-admin-list">
          {ads.map(ad => (
            <div key={ad.id} className={`ads-admin-card ${!ad.enabled ? 'disabled' : ''}`}
              style={{ background: ad.bg_color || '#f8fafc', gridColumn: `span ${ad.columns}` }}>
              <div className="ads-admin-card-inner">
                <div className="ads-admin-meta">
                  <span className="ads-admin-title">{ad.title}</span>
                  {ad.badge && (
                    <span className="ad-badge" style={{ '--ad-badge-bg': ad.badge_color || '#6366f1' }}>{ad.badge}</span>
                  )}
                  <span className="ads-admin-cols">{ad.columns === 2 ? '全宽' : '半宽'}</span>
                  {!ad.enabled && <span className="ads-admin-off">已禁用</span>}
                </div>
                {ad.description && <div className="ads-admin-desc">{ad.description}</div>}
                {ad.link && <div className="ads-admin-link">🔗 {ad.link}</div>}
              </div>
              <div className="ads-admin-actions">
                <button className="btn-sm btn-edit" onClick={() => openEdit(ad)}>编辑</button>
                <button className="btn-sm" style={{ background: ad.enabled ? '#fef9c3' : '#f0fdf4', color: ad.enabled ? '#854d0e' : '#166534' }}
                  onClick={() => toggleEnabled(ad)}>{ad.enabled ? '禁用' : '启用'}</button>
                <button className="btn-sm btn-delete" onClick={() => handleDelete(ad.id)}>删除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AdModal
          ad={editAd}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
