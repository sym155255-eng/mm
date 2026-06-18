import React from 'react';

// 本地确定性卡通头像：同一个 seed（昵称）永远生成同一张可爱头像，无需外部服务
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const BG   = ['#fde68a', '#fca5a5', '#a7f3d0', '#bfdbfe', '#ddd6fe', '#fbcfe8', '#fed7aa', '#99f6e4', '#c7d2fe'];
const HAIR = ['#3b3b3b', '#6b4f3a', '#b45309', '#1f2937', '#7c3aed', '#dc2626', '#0ea5e9'];
const SKIN = ['#ffe0bd', '#f8d2b0', '#f1c6a7', '#ffdab8'];

export default function Avatar({ seed = '', size = 28, style }) {
  const h = hash(String(seed) || 'anon');
  const bg = BG[h % BG.length];
  const hair = HAIR[(h >> 3) % HAIR.length];
  const skin = SKIN[(h >> 6) % SKIN.length];
  const eyeType = (h >> 9) % 3;     // 0 圆 1 竖线(眯) 2 大眼
  const mouthType = (h >> 12) % 3;  // 0 微笑 1 笑开 2 小嘴
  const hairType = (h >> 15) % 3;   // 刘海样式

  const eyes = eyeType === 1
    ? <><line x1="13" y1="20" x2="15" y2="20" stroke="#333" strokeWidth="1.6" strokeLinecap="round" /><line x1="21" y1="20" x2="23" y2="20" stroke="#333" strokeWidth="1.6" strokeLinecap="round" /></>
    : eyeType === 2
      ? <><circle cx="14" cy="20" r="2.3" fill="#333" /><circle cx="22" cy="20" r="2.3" fill="#333" /><circle cx="14.8" cy="19.2" r="0.7" fill="#fff" /><circle cx="22.8" cy="19.2" r="0.7" fill="#fff" /></>
      : <><circle cx="14" cy="20" r="1.5" fill="#333" /><circle cx="22" cy="20" r="1.5" fill="#333" /></>;

  const mouth = mouthType === 1
    ? <path d="M14 25 q4 4 8 0" fill="#e0606a" stroke="#c44" strokeWidth="0.8" />
    : mouthType === 2
      ? <circle cx="18" cy="26" r="1.4" fill="#c44" />
      : <path d="M14.5 25 q3.5 3 7 0" fill="none" stroke="#b9555f" strokeWidth="1.6" strokeLinecap="round" />;

  const hairTop = hairType === 0
    ? <path d="M8 17 a10 10 0 0 1 20 0 q-10 -7 -20 0Z" fill={hair} />
    : hairType === 1
      ? <path d="M8 18 a10 10 0 0 1 20 0 l0 -2 q-10 -9 -20 0Z" fill={hair} />
      : <path d="M8 17 a10 10 0 0 1 20 0 q-5 -4 -10 -4 q-5 0 -10 4Z" fill={hair} />;

  return (
    <svg width={size} height={size} viewBox="0 0 36 36" style={{ borderRadius: '50%', flexShrink: 0, display: 'block', ...style }}>
      <rect width="36" height="36" fill={bg} />
      <ellipse cx="18" cy="32" rx="11" ry="8" fill={skin} />
      <circle cx="18" cy="20" r="10" fill={skin} />
      {hairTop}
      {eyes}
      {mouth}
      <circle cx="11.5" cy="23" r="1.6" fill="#f9a8a8" opacity="0.6" />
      <circle cx="24.5" cy="23" r="1.6" fill="#f9a8a8" opacity="0.6" />
    </svg>
  );
}
