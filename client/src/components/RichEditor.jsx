import React, { useRef, useEffect, useState } from 'react';
import { uploadIcon } from '../api';

// 轻量富文本编辑器（contentEditable + 工具栏），输出 HTML
export default function RichEditor({ value, onChange, placeholder = '内容', minHeight = 320 }) {
  const ref = useRef(null);
  const fileRef = useRef(null);
  const [count, setCount] = useState(0);

  // 外部 value 初始化/切换时同步（避免光标跳动：仅在不一致时写入）
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
      setCount(ref.current.innerText.trim().length);
    }
  }, [value]);

  function emit() {
    if (!ref.current) return;
    onChange(ref.current.innerHTML);
    setCount(ref.current.innerText.trim().length);
  }
  function cmd(command, arg) {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  }
  function insertImage() {
    const url = prompt('图片地址 URL（也可以用“上传图片”按钮）');
    if (url) cmd('insertImage', url);
  }
  function insertLink() {
    const url = prompt('链接地址 URL');
    if (url) cmd('createLink', url);
  }
  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try { const res = await uploadIcon(file); if (res.path) cmd('insertImage', res.path); else alert('上传失败'); }
    catch (err) { alert('上传失败：' + err.message); }
    e.target.value = '';
  }

  const Btn = ({ on, title, children, active }) => (
    <button type="button" title={title} onMouseDown={e => e.preventDefault()} onClick={on}
      style={{ ...t.btn, ...(active ? t.btnActive : {}) }}>{children}</button>
  );

  return (
    <div style={t.wrap}>
      <div style={t.bar}>
        <Btn on={() => cmd('undo')} title="撤销">↶</Btn>
        <Btn on={() => cmd('redo')} title="重做">↷</Btn>
        <span style={t.sep} />
        <select onChange={e => cmd('formatBlock', e.target.value)} defaultValue="" style={t.select} title="段落格式">
          <option value="" disabled>段落</option>
          <option value="<h1>">大标题 H1</option>
          <option value="<h2>">标题 H2</option>
          <option value="<h3>">小标题 H3</option>
          <option value="<p>">正文</option>
        </select>
        <Btn on={() => cmd('bold')} title="加粗"><b>B</b></Btn>
        <Btn on={() => cmd('italic')} title="斜体"><i>I</i></Btn>
        <Btn on={() => cmd('underline')} title="下划线"><u>U</u></Btn>
        <label style={{ ...t.btn, position: 'relative', cursor: 'pointer' }} title="文字颜色">
          A<span style={{ display: 'block', height: 3, background: '#e64340', borderRadius: 2, marginTop: -2 }} />
          <input type="color" onChange={e => cmd('foreColor', e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
        </label>
        <Btn on={() => cmd('removeFormat')} title="清除格式">T×</Btn>
        <span style={t.sep} />
        <Btn on={() => cmd('justifyLeft')} title="左对齐">⬅</Btn>
        <Btn on={() => cmd('justifyCenter')} title="居中">⬛</Btn>
        <Btn on={() => cmd('justifyRight')} title="右对齐">➡</Btn>
        <Btn on={() => cmd('formatBlock', '<blockquote>')} title="引用">❝</Btn>
        <Btn on={() => cmd('insertUnorderedList')} title="无序列表">•≡</Btn>
        <Btn on={() => cmd('insertOrderedList')} title="有序列表">1≡</Btn>
        <span style={t.sep} />
        <Btn on={insertImage} title="插入图片">🖼️</Btn>
        <Btn on={() => fileRef.current?.click()} title="上传图片">📁</Btn>
        <Btn on={insertLink} title="插入链接">🔗</Btn>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      </div>

      <div ref={ref} contentEditable suppressContentEditableWarning
        onInput={emit} data-placeholder={placeholder}
        className="rich-editable"
        style={{ ...t.area, minHeight }} />

      <div style={t.foot}>{count} 个字</div>
    </div>
  );
}

const t = {
  wrap: { border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff' },
  bar: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, padding: '6px 8px', borderBottom: '1px solid #eef2f6', background: '#fafbfc' },
  btn: { minWidth: 30, height: 30, padding: '0 7px', border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', fontSize: 14, color: '#374151', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 },
  btnActive: { background: '#eff2ff', color: 'var(--primary)' },
  select: { height: 30, border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, padding: '0 4px', cursor: 'pointer' },
  sep: { width: 1, height: 18, background: '#e5e7eb', margin: '0 4px' },
  area: { padding: '12px 14px', fontSize: 14, lineHeight: 1.8, color: '#333', outline: 'none', overflowY: 'auto', maxHeight: 480 },
  foot: { borderTop: '1px solid #eef2f6', padding: '5px 12px', fontSize: 12, color: '#9ca3af', textAlign: 'right' },
};
