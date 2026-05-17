import { useState, useEffect, useCallback } from 'react';
import { fetchUsers, updateUserRole, deleteUser } from '../services/dataService';

// admin page - only admin can see this
function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = useCallback(async () => {
    try { setLoading(true); setUsers(await fetchUsers()); }
    catch (err) { setError('Failed to load users.'); }
    finally { setLoading(false); }
  }, []);

  const handleRoleChange = useCallback(async (userId, newRole) => {
    try { await updateUserRole(userId, newRole); loadUsers(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to update role.'); }
  }, [loadUsers]);

  const handleDelete = useCallback(async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This will also delete all their transactions.`)) return;
    try { await deleteUser(userId); loadUsers(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete user.'); }
  }, [loadUsers]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
        <div className="w-10 h-10 border-[3px] border-[var(--border-color)] border-t-[var(--accent)] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) return <div className="text-center py-16 text-base" style={{ color: 'var(--danger)' }}>{error}</div>;

  return (
    <div id="admin-page">
      <div className="flex justify-between items-start mb-7 flex-wrap gap-4">
        <div>
          <h1 className="text-[28px] font-bold">User Management</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage user accounts and roles</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse rounded-xl overflow-hidden border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }} id="users-table">
          <thead>
            <tr>
              {['ID','Name','Email','Role','Joined','Actions'].map(h => (
                <th key={h} className="px-[18px] py-3.5 text-left text-xs font-medium uppercase tracking-wider border-b" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="transition-colors hover:bg-[var(--card-bg-hover)]">
                <td className="px-[18px] py-3.5 text-sm border-b" style={{ borderColor: 'var(--border-color)' }}>{u.id}</td>
                <td className="px-[18px] py-3.5 text-sm border-b" style={{ borderColor: 'var(--border-color)' }}>{u.name}</td>
                <td className="px-[18px] py-3.5 text-sm border-b" style={{ borderColor: 'var(--border-color)' }}>{u.email}</td>
                <td className="px-[18px] py-3.5 text-sm border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <select 
                    value={u.role} 
                    onChange={e => handleRoleChange(u.id, e.target.value)} 
                    className="px-2.5 py-1.5 border rounded-lg text-[13px] font-sans"
                    style={{ background: 'var(--input-bg)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                  >
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                    <option value="read-only">Read-only</option>
                  </select>
                </td>
                <td className="px-[18px] py-3.5 text-sm border-b" style={{ borderColor: 'var(--border-color)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-[18px] py-3.5 text-sm border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <button 
                    className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border-none hover:opacity-90 transition-opacity"
                    onClick={() => handleDelete(u.id, u.name)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminPage;
