import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Package, Plus, Search, Filter, QrCode, ChevronRight, Leaf, ExternalLink } from 'lucide-react';
import { api } from '../../context/AuthContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STAGE_COLORS = {
  harvested: 'badge-pending',
  lab_testing: 'badge-active',
  manufacturing: 'badge-active',
  packaging: 'badge-active',
  distributed: 'badge-active',
  verified: 'badge-verified',
  rejected: 'badge-rejected',
  collected: 'badge-pending',
};

export default function BatchesPage() {
  const { hasRole } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState({ status: '', stage: '', herb: searchParams.get('search') || '' });

  const fetchBatches = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      const { data } = await api.get(`/batches?${params}`);
      setBatches(data.data);
      setPagination(data.pagination);
    } catch (err) {
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBatches(); }, [filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, herb: searchInput }));
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Product Batches</h1>
          <p className="text-gray-400 text-sm mt-1">{pagination.total || 0} total batches</p>
        </div>
        {hasRole('manufacturer', 'farmer', 'admin') && (
          <Link to="/batches/create" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Batch
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by herb name..."
              className="input-field pl-10 py-2.5 text-sm"
            />
          </div>
          <button type="submit" className="btn-secondary px-4 py-2.5 text-sm">Search</button>
        </form>
        <div className="flex gap-2">
          <select
            value={filters.stage}
            onChange={(e) => setFilters((p) => ({ ...p, stage: e.target.value }))}
            className="input-field text-sm py-2.5 w-auto"
          >
            <option value="" style={{ background: '#111128' }}>All Stages</option>
            {['harvested', 'lab_testing', 'manufacturing', 'packaging', 'distributed', 'verified', 'rejected'].map(s => (
              <option key={s} value={s} style={{ background: '#111128' }}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            className="input-field text-sm py-2.5 w-auto"
          >
            <option value="" style={{ background: '#111128' }}>All Status</option>
            {['active', 'completed', 'rejected', 'recalled'].map(s => (
              <option key={s} value={s} style={{ background: '#111128' }}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Batches Table */}
      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="table-header">Batch</th>
              <th className="table-header hidden md:table-cell">Herb</th>
              <th className="table-header hidden lg:table-cell">Supplier</th>
              <th className="table-header">Stage</th>
              <th className="table-header hidden sm:table-cell">Blockchain</th>
              <th className="table-header hidden lg:table-cell">Created</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i} className="table-row">
                  {Array(7).fill(0).map((_, j) => (
                    <td key={j} className="table-cell"><div className="h-4 skeleton rounded w-24" /></td>
                  ))}
                </tr>
              ))
            ) : batches.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-cell text-center text-gray-500 py-12">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No batches found</p>
                  {hasRole('manufacturer', 'farmer', 'admin') && (
                    <Link to="/batches/create" className="text-indigo-400 text-sm mt-2 inline-block">Create your first batch →</Link>
                  )}
                </td>
              </tr>
            ) : (
              batches.map((batch) => (
                <tr key={batch._id} className="table-row hover:bg-white/[0.02] transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                        <Leaf className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-mono text-xs text-indigo-400 font-semibold">{batch.batchId}</p>
                        <p className="text-xs text-gray-500 md:hidden">{batch.herbName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell hidden md:table-cell">
                    <p className="font-medium text-white">{batch.herbName}</p>
                    <p className="text-xs text-gray-500">{batch.productCategory}</p>
                  </td>
                  <td className="table-cell hidden lg:table-cell text-gray-400 text-xs">
                    {batch.supplier?.name || batch.supplierName || '-'}
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${STAGE_COLORS[batch.currentStage] || 'badge-pending'} capitalize text-[11px]`}>
                      {batch.currentStage?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="table-cell hidden sm:table-cell">
                    {batch.blockchainTxHash ? (
                      <span className="hash-text truncate max-w-[100px] inline-block">
                        {batch.blockchainTxHash.slice(0, 12)}...
                      </span>
                    ) : '-'}
                  </td>
                  <td className="table-cell hidden lg:table-cell text-xs text-gray-500">
                    {format(new Date(batch.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <Link to={`/batches/${batch.batchId}`} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                        View <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
            <p className="text-xs text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button disabled={pagination.page <= 1} onClick={() => fetchBatches(pagination.page - 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30">Prev</button>
              <button disabled={pagination.page >= pagination.pages} onClick={() => fetchBatches(pagination.page + 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
