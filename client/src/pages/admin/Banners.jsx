import React, { useEffect, useState, useRef } from 'react';
import { getBanners, createBanner, updateBanner, deleteBanner, uploadIcon } from '../../api';

export default function Banners() {
  const [list, setList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const fileRef = useRef(null);

  async function load() { setList(await getBanners()); }
  useEffect(() => { load(); }, []);

  // 选图后：先上传得到图片地址，再创建一条 banner
  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadIcon(file);
      if (res.path) {
        await createBanner({ image_url: res.path, url: newUrl, visible: 1, sort_order: list.length });
        setNewUrl('');
        load();
      } else alert('上传失败：' + (res.error || '未知'));
    } catch (err) { alert('上传失败：' + err.message); }
    setUploading(false);
    e.target.value = '';
  }

  async function setLink(b, url) {
    await updateBanner(b.id, { ...b, url });
    setList(prev => prev.map(x => x.id === b.id ? { ...x, url } : x));
  }
  async function toggleVisible(b) {
    await updateBanner(b.id, { ...b, visible: b.visible ? 0 : 1 });
    load();
  }
  async function move(b, dir) {
    const arr = [...list];
    const i = arr.findIndex(x => x.id === b.id);
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    for (let k = 0; k < arr.length; k++) await updateBanner(arr[k].id, { ...arr[k], sort_order: k });
    load();
  }
  async function handleDelete(id) {
    if (!confirm('确认删除此横幅图片？')) return;
    await deleteBanner(id);
    load();
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>图片管理（搜索框下方横幅）</h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>上传整幅横幅大图，可设置点击跳转链接，多张从上到下排列显示。</p>

      {/* 上传区 */}
      <div style={s.uploadCard}>
        <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="（可选）点击图片跳转的链接 https://..."
          style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, minWidth: 0 }} />
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} style={s.uploadBtn}>
          {uploading ? '上传中…' : '📁 上传横幅图片'}
        </button>
      </div>

      {/* 列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {list.map((b, i) => (
          <div key={b.id} style={s.item}>
            <img src={b.image_url} alt="" style={{ width: '100%', display: 'block', borderRadius: 8, border: '1px solid #eee' }} />
            <div style={s.itemBar}>
              <input value={b.url || ''} onChange={e => setLink(b, e.target.value)} placeholder="点击跳转链接（留空不跳转）"
                style={{ flex: 1, padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, minWidth: 0 }} />
              <button onClick={() => move(b, -1)} disabled={i === 0} style={s.smBtn}>↑</button>
              <button onClick={() => move(b, 1)} disabled={i === list.length - 1} style={s.smBtn}>↓</button>
              <button onClick={() => toggleVisible(b)} style={{ ...s.smBtn, color: b.visible ? '#16a34a' : '#9ca3af', width: 'auto', padding: '0 10px' }}>
                {b.visible ? '显示' : '隐藏'}
              </button>
              <button onClick={() => handleDelete(b.id)} style={s.delBtn}>删除</button>
            </div>
          </div>
        ))}
        {list.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>暂无图片，点上方上传</div>}
      </div>
    </div>
  );
}

const s = {
  uploadCard: { display: 'flex', gap: 10, alignItems: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 20 },
  uploadBtn: { background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  item: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 },
  itemBar: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 },
  smBtn: { width: 32, height: 30, border: '1px solid #e5e7eb', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 13, flexShrink: 0 },
  delBtn: { background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '0 14px', height: 30, fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
};
