import { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { useAuth } from '../../store/auth';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const { user: currentUser } = useAuth();

  const load = () => adminApi.getUsers().then(res => setUsers(res.data));
  useEffect(() => { load(); }, []);

  const handleRoleToggle = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    if (!confirm(`将 ${u.username} 的角色改为 ${newRole}？`)) return;
    await adminApi.updateUserRole(u.id, newRole);
    load();
  };

  const handleDelete = async (u) => {
    if (u.id === currentUser.id) return alert('不能删除自己');
    if (!confirm(`确认删除用户 ${u.username}？`)) return;
    await adminApi.deleteUser(u.id);
    load();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">用户管理</h1>
        <span className="meta-count">共 {users.length} 名用户</span>
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>ID</th><th>用户名</th><th>邮箱</th><th>角色</th><th>注册时间</th><th>操作</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>
                  {u.username}
                  {u.id === currentUser.id && <span className="badge-me">我</span>}
                </td>
                <td>{u.email || '-'}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                    {u.role === 'admin' ? '管理员' : '普通用户'}
                  </span>
                </td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  {u.id !== currentUser.id && (
                    <>
                      <button className="btn-sm btn-edit" onClick={() => handleRoleToggle(u)}>
                        {u.role === 'admin' ? '降级' : '升管理'}
                      </button>
                      <button className="btn-sm btn-delete" onClick={() => handleDelete(u)}>删除</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
