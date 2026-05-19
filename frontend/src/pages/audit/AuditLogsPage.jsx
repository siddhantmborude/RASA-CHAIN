import { useEffect, useState } from 'react';
import { Shield, Filter } from 'lucide-react';
import { api } from '../../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const SEVERITY_COLORS = { low: 'text-gray-400', medium: 'text-amber-400', high: 'text-orange-400', critical: 'text-red-400' };
const STATUS_COLORS = { success: 'badge-verified', failure: 'badge-rejected', warning: 'badge-pending' };

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: '', status: '', severity: '' });
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page, limit: 20, ...Object.fromEntries(Object.entries(filter).filter(([, v]) => v)) });
        const { data } = await api.get(`/audit?${params}`);
        setLogs(data.data);
        setPagination(data.pagination);
      } catch (err) {
        toast.error('Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page, filter]);

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Shield className="w-6 h-6 text-amber-400" />
          Audit Logs
        </h1>
        <p className="text-gray-400 text-sm mt-1">Complete system activity trail for compliance</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-wrap gap-3">
        {[
          { key: 'category', options: ['auth', 'batch', 'blockchain', 'user', 'report', 'sensor', 'system', 'verification'] },
          { key: 'status', options: ['success', 'failure', 'warning'] },
          { key: 'severity', options: ['low', 'medium', 'high', 'critical'] },
        ].map(({ key, options }) => (
          <select key={key} value={filter[key]} onChange={(e) => setFilter(p => ({ ...p, [key]: e.target.value }))} className="input-field text-sm py-2 w-auto capitalize">
            <option value="" style={{ background: '#111128' }}>All {key}s</option>
            {options.map(o => <option key={o} value={o} style={{ background: '#111128' }}>{o}</option>)}
          </select>
        ))}
      </div>

      {/* Logs Table */}
      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Timestamp', 'Action', 'User', 'Category', 'Status', 'Severity'].map(h => (
                <th key={h} className="table-header">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <tr key={i}>{Array(6).fill(0).map((_, j) => <td key={j} className="table-cell"><div className="h-4 skeleton rounded w-20" /></td>)}</tr>
              ))
            ) : logs.map((log) => (
              <tr key={log._id} className="table-row">
                <td className="table-cell text-xs text-gray-500 whitespace-nowrap">
                  {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                </td>
                <td className="table-cell text-sm text-white">{log.action}</td>
                <td className="table-cell text-xs text-gray-400">{log.userName || 'System'}</td>
                <td className="table-cell"><span className="badge badge-active capitalize">{log.category}</span></td>
                <td className="table-cell"><span className={`badge ${STATUS_COLORS[log.status] || 'badge-pending'} capitalize`}>{log.status}</span></td>
                <td className="table-cell"><span className={`text-xs font-semibold capitalize ${SEVERITY_COLORS[log.severity]}`}>{log.severity}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
            <p className="text-xs text-gray-500">Page {page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30">← Prev</button>
              <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
