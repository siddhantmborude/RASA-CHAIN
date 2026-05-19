import { useEffect, useState } from 'react';
import { Users, CheckCircle, Ban, Search } from 'lucide-react';
import { api } from '../../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
  admin: 'text-red-400 bg-red-400/10', farmer: 'text-green-400 bg-green-400/10',
  manufacturer: 'text-blue-400 bg-blue-400/10', lab: 'text-purple-400 bg-purple-400/10',
  regulator: 'text-amber-400 bg-amber-400/10', consumer: 'text-gray-400 bg-gray-400/10',
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const { data } = await api.get(`/users?${params}`);
      setUsers(data.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const verifyUser = async (id) => {
    try {
      await api.patch(`/users/${id}/verify`);
      toast.success('User verified');
      fetchUsers();
    } catch (err) { toast.error('Failed'); }
  };

  const deactivateUser = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await api.patch(`/users/${id}/deactivate`);
      toast.success('User deactivated');
      fetchUsers();
    } catch (err) { toast.error('Failed'); }
  };

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Users className="w-6 h-6 text-indigo-400" />
          User Management
        </h1>
      </div>

      <div className="glass-card p-4 mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchUsers()} placeholder="Search users..." className="input-field pl-10 py-2.5 text-sm" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input-field text-sm py-2.5 w-auto">
          <option value="" style={{ background: '#111128' }}>All Roles</option>
          {['admin', 'farmer', 'manufacturer', 'lab', 'regulator', 'consumer'].map(r => (
            <option key={r} value={r} style={{ background: '#111128' }}>{r}</option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['User', 'Role', 'Organization', 'Verified', 'Joined', 'Actions'].map(h => <th key={h} className="table-header">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? Array(5).fill(0).map((_, i) => (
              <tr key={i}>{Array(6).fill(0).map((_, j) => <td key={j} className="table-cell"><div className="h-4 skeleton rounded w-20" /></td>)}</tr>
            )) : users.map((user) => (
              <tr key={user._id} className="table-row">
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${ROLE_COLORS[user.role]}`}>{user.role}</span>
                </td>
                <td className="table-cell text-xs text-gray-400">{user.organization || '-'}</td>
                <td className="table-cell">
                  {user.isVerified ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <span className="text-xs text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">Pending</span>
                  )}
                </td>
                <td className="table-cell text-xs text-gray-500">{format(new Date(user.createdAt), 'MMM d, yyyy')}</td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    {!user.isVerified && (
                      <button onClick={() => verifyUser(user._id)} className="btn-success text-xs px-3 py-1.5 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />Verify
                      </button>
                    )}
                    {user.isActive && (
                      <button onClick={() => deactivateUser(user._id)} className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1">
                        <Ban className="w-3 h-3" />Disable
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
