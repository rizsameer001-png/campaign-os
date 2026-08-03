import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import Button from '../../../components/common/Button';
import { inputClasses } from '../../../components/common/FormField';

const STATUS_COLORS = {
  pending_approval: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-orange-100 text-orange-700',
  banned: 'bg-red-100 text-red-700',
  deleted: 'bg-gray-100 text-gray-500',
};

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ role: '', status: '', search: '' });
  const [selected, setSelected] = useState([]);

  useEffect(() => { load(); }, [filters]);

  async function load() {
    const { data } = await api.get('/admin/users', { params: filters });
    setUsers(data.data);
  }

  async function handleAction(userId, action) {
    await api.post(`/admin/users/${userId}/${action}`);
    load();
  }

  async function handleBulk(action) {
    if (selected.length === 0) return;
    await api.post('/admin/users/bulk', { userIds: selected, action });
    setSelected([]);
    load();
  }

  function toggleSelect(userId) {
    setSelected((s) => (s.includes(userId) ? s.filter((id) => id !== userId) : [...s, userId]));
  }

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">User Management</h1>

      <div className="flex gap-3 mb-4">
        <input
          className={inputClasses(false) + ' max-w-xs'}
          placeholder="Search name/email"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        <select className={inputClasses(false) + ' max-w-xs'} value={filters.role} onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}>
          <option value="">All roles</option>
          <option value="candidate">Candidate</option>
          <option value="volunteer">Volunteer</option>
          <option value="admin">Admin</option>
        </select>
        <select className={inputClasses(false) + ' max-w-xs'} value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All statuses</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {selected.length > 0 && (
        <div className="flex gap-2 mb-4">
          <Button onClick={() => handleBulk('approve')}>Approve Selected ({selected.length})</Button>
          <Button variant="secondary" onClick={() => handleBulk('suspend')}>Suspend Selected</Button>
          <Button variant="danger" onClick={() => handleBulk('ban')}>Ban Selected</Button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 divide-y">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)} />
              <div>
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-xs text-gray-500">{u.email} · {u.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs rounded-full px-2 py-1 ${STATUS_COLORS[u.status]}`}>{u.status}</span>
              {u.status === 'pending_approval' && (
                <Button onClick={() => handleAction(u.id, 'approve')}>Approve</Button>
              )}
              {u.status === 'active' && (
                <Button variant="secondary" onClick={() => handleAction(u.id, 'suspend')}>Suspend</Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
