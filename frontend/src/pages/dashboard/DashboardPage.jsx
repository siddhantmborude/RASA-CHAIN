import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, CheckCircle, Clock, AlertTriangle, Link2, TrendingUp,
  Activity, ArrowRight, RefreshCw, BarChart3, Leaf
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useAuth, api } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STAGE_COLORS = {
  harvested: '#f59e0b',
  collected: '#a78bfa',
  lab_testing: '#60a5fa',
  manufacturing: '#34d399',
  packaging: '#f472b6',
  distributed: '#818cf8',
  verified: '#10b981',
  rejected: '#ef4444',
};

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#a78bfa', '#34d399'];

function StatCard({ icon: Icon, label, value, sub, color, loading }) {
  return (
    <div className="glass-card p-6 hover:border-white/20 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium">{label}</p>
          {loading ? (
            <div className="h-8 w-20 skeleton rounded-lg mt-2" />
          ) : (
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          )}
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color === 'text-emerald-400' ? 'bg-emerald-500/10' : color === 'text-amber-400' ? 'bg-amber-500/10' : color === 'text-red-400' ? 'bg-red-500/10' : 'bg-indigo-500/10'}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 border border-white/10 text-xs">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/dashboard/stats');
      setStats(data.data);
    } catch (err) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const ov = stats?.overview;
  const batchesByMonth = stats?.charts?.batchesByMonth || [];
  const topHerbs = stats?.charts?.topHerbs || [];
  const batchesByStage = stats?.charts?.batchesByStage || [];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Here's your herbal supply chain overview
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Package}
          label="Total Batches"
          value={loading ? '...' : ov?.totalBatches || 0}
          sub="All products"
          color="text-indigo-400"
          loading={loading}
        />
        <StatCard
          icon={CheckCircle}
          label="Verified"
          value={loading ? '...' : ov?.verifiedBatches || 0}
          sub={`${ov?.verificationRate || 0}% rate`}
          color="text-emerald-400"
          loading={loading}
        />
        <StatCard
          icon={Clock}
          label="Pending Approval"
          value={loading ? '...' : ov?.pendingApproval || 0}
          sub="Awaiting review"
          color="text-amber-400"
          loading={loading}
        />
        <StatCard
          icon={Link2}
          label="Blockchain Txs"
          value={loading ? '...' : ov?.totalBlockchainTx || 0}
          sub="Immutable records"
          color="text-purple-400"
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Monthly Batches Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Batch Trends
            </h3>
            <span className="text-xs text-gray-500">Last 12 months</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={batchesByMonth}>
              <defs>
                <linearGradient id="colorBatches" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="_id" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" name="Batches" stroke="#6366f1" strokeWidth={2} fill="url(#colorBatches)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stage Distribution */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            By Stage
          </h3>
          {loading ? (
            <div className="h-48 skeleton rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={batchesByStage}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%" cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {batchesByStage.map((entry, index) => (
                    <Cell key={index} fill={STAGE_COLORS[entry._id] || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Batches */}
        <div className="glass-card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-400" />
              Recent Batches
            </h3>
            <Link to="/batches" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 skeleton rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 skeleton rounded w-3/4" />
                    <div className="h-2 skeleton rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : stats?.recentActivity?.batches?.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500 text-sm">No batches yet</div>
            ) : (
              stats?.recentActivity?.batches?.map((batch) => (
                <Link key={batch._id} to={`/batches/${batch.batchId}`} className="flex items-center gap-3 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{batch.herbName}</p>
                    <p className="text-xs text-gray-500 font-mono">{batch.batchId}</p>
                  </div>
                  <div>
                    <span className={`badge text-xs ${batch.isVerified ? 'badge-verified' : batch.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                      {batch.currentStage}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Blockchain Transactions */}
        <div className="glass-card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Recent Blockchain Txs
            </h3>
            <Link to="/blockchain" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              Explorer <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="px-6 py-3 flex items-center gap-3">
                  <div className="h-3 skeleton rounded w-full" />
                </div>
              ))
            ) : stats?.recentActivity?.transactions?.map((tx) => (
              <div key={tx._id} className="flex items-center gap-3 px-6 py-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 node-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-indigo-400 truncate">{tx.txHash?.slice(0, 30)}...</p>
                  <p className="text-[10px] text-gray-500">{tx.eventType?.replace(/_/g, ' ')} · {tx.batchId}</p>
                </div>
                <span className="text-[10px] text-gray-600 whitespace-nowrap">
                  {tx.blockNumber ? `#${tx.blockNumber}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
