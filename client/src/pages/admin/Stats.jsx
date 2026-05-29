import { useEffect, useState } from 'react';
import { adminApi } from '../../api';

export default function Stats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminApi.getStats().then(res => setStats(res.data));
  }, []);

  if (!stats) return <div className="admin-loading">加载中...</div>;

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">数据统计</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📰</div>
          <div className="stat-value">{stats.links}</div>
          <div className="stat-label">导航总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-value">{stats.categories}</div>
          <div className="stat-label">分类总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats.users}</div>
          <div className="stat-label">注册用户</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👆</div>
          <div className="stat-value">{stats.total_clicks}</div>
          <div className="stat-label">总点击量</div>
        </div>
      </div>

      <div className="top-links-card">
        <h2>点击排行 Top 10</h2>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>#</th><th>网站名称</th><th>地址</th><th>点击量</th></tr>
            </thead>
            <tbody>
              {stats.top_links.map((link, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{link.title}</td>
                  <td><a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a></td>
                  <td>{link.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
