import { useEffect, useState } from 'react';
import { Link2, Search, Filter, ExternalLink } from 'lucide-react';
import { api } from '../../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const EVENT_COLORS = {
  batch_created: 'bg-indigo-500', harvest_entry: 'bg-green-500', lab_testing: 'bg-blue-500',
  manufacturing: 'bg-purple-500', packaging: 'bg-amber-500', distribution: 'bg-pink-500',
  verification: 'bg-emerald-500', verified: 'bg-emerald-500', regulatory_approval: 'bg-teal-500',
  sensor_upload: 'bg-cyan-500', tamper_detected: 'bg-red-500',
};

export default function BlockchainExplorerPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({});
  const [filter, setFilter] = useState({ eventType: '', network: '' });
  const [page, setPage] = useState(1);

  const fetchTx = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 15, ...Object.fromEntries(Object.entries(filter).filter(([, v]) => v)) });
      const [txRes, statsRes] = await Promise.all([
        api.get(`/blockchain/explorer?${params}`),
        api.get('/blockchain/stats'),
      ]);
      setTransactions(txRes.data.data);
      setPagination(txRes.data.pagination);
      setStats(statsRes.data.data);
    } catch (err) {
      toast.error('Failed to load blockchain data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTx(page); }, [page, filter]);

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-indigo-400" />
          </div>
          Blockchain Explorer
        </h1>
        <p className="text-gray-400 text-sm mt-1">Immutable record of all supply chain events</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Transactions', value: stats.totalTransactions, color: 'text-indigo-400' },
            { label: 'Network', value: stats.network?.toUpperCase(), color: 'text-emerald-400' },
            { label: 'Latest Block', value: stats.lastBlock ? `#${stats.lastBlock}` : 'N/A', color: 'text-amber-400' },
            { label: 'Event Types', value: stats.byEventType?.length || 0, color: 'text-purple-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass-card p-4">
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex gap-3">
        <select value={filter.eventType} onChange={(e) => setFilter(p => ({ ...p, eventType: e.target.value }))} className="input-field text-sm py-2.5 w-auto">
          <option value="" style={{ background: '#111128' }}>All Events</option>
          {['batch_created', 'harvest_entry', 'lab_testing', 'manufacturing', 'packaging', 'distribution', 'verification', 'verified', 'regulatory_approval', 'sensor_upload'].map(e => (
            <option key={e} value={e} style={{ background: '#111128' }}>{e.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {loading ? (
          Array(8).fill(0).map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)
        ) : transactions.length === 0 ? (
          <div className="glass-card p-12 text-center text-gray-500">
            <Link2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No blockchain transactions found</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx._id} className="glass-card p-4 flex items-center gap-4 hover:border-indigo-500/20 transition-all">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${EVENT_COLORS[tx.eventType] || 'bg-gray-500'} node-pulse`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-bold text-white capitalize">{tx.eventType?.replace(/_/g, ' ')}</span>
                  <span className="hash-text truncate max-w-[200px]">{tx.txHash}</span>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Confirmed
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-0.5">
                  <span className="text-xs text-gray-500">Batch: <span className="text-indigo-400 font-mono">{tx.batchId}</span></span>
                  <span className="text-xs text-gray-600">Block #{tx.blockNumber}</span>
                  <span className="text-xs text-gray-600">{format(new Date(tx.timestamp), 'MMM d, HH:mm:ss')}</span>
                  {tx.userId?.name && <span className="text-xs text-gray-600">by {tx.userId.name}</span>}
                </div>
              </div>
              <div className="text-xs text-gray-600 hidden md:block">{tx.gasUsed?.toLocaleString()} gas</div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-gray-500">Page {pagination.page} of {pagination.pages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30">← Prev</button>
            <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
