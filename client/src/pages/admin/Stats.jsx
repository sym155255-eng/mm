import React, { useEffect, useState } from 'react';
import { getStats } from '../../api';

export default function Stats() {
  const [data, setData] = useState(null);

  useEffect(() => { getStats().then(setData); }, []);

  if (!data) return <div style={{ color: '#9ca3af', padding: 20 }}>加载中…</div>;

  const cards = [
    { label: '今日浏览量 (PV)', value: data.todayPv, color: '#4f6ef7' },
    { label: '今日独立访客 (UV)', value: data.todayUv, color: '#16a34a' },
    { label: '累计浏览量', value: data.totalPv, color: '#f59e0b' },
    { label: '累计独立访客', value: data.totalUv, color: '#a855f7' },
    { label: '链接总点击', value: data.linkViews, color: '#ec4899' },
  ];
  const series = data.series || [];
  const maxPv = Math.max(1, ...series.map(s => s.pv));

  return (
    <div style={{ maxWidth: 820 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>访客统计</h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>真实数据：访客打开页面时记录。PV=浏览次数，UV=按 IP 去重的独立访客（每天重置）。</p>

      {/* 数字卡片 */}
      <div style={s.cards}>
        {cards.map(c => (
          <div key={c.label} style={s.card}>
            <div style={{ fontSize: 26, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* 近 14 天柱状图 */}
      <div style={s.chartCard}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>近 14 天浏览量</div>
        {series.length === 0 ? (
          <div style={{ color: '#9ca3af', fontSize: 14, padding: '20px 0' }}>暂无数据</div>
        ) : (
          <div style={s.chart}>
            {series.map(d => (
              <div key={d.date} style={s.barCol} title={`${d.date}  PV ${d.pv} / UV ${d.uv}`}>
                <span style={{ fontSize: 11, color: '#6b7280' }}>{d.pv}</span>
                <div style={{ ...s.bar, height: `${Math.round((d.pv / maxPv) * 120)}px` }} />
                <span style={s.barLabel}>{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 20 },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px 16px', textAlign: 'center' },
  chartCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 22px' },
  chart: { display: 'flex', alignItems: 'flex-end', gap: 8, height: 170, overflowX: 'auto' },
  barCol: { flex: '1 0 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, justifyContent: 'flex-end' },
  bar: { width: 22, minHeight: 2, background: 'linear-gradient(180deg, #6366f1, #4f6ef7)', borderRadius: '4px 4px 0 0' },
  barLabel: { fontSize: 10, color: '#9ca3af', whiteSpace: 'nowrap' },
};
