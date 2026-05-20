import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { QrCode, Search, Leaf, ArrowRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function QRScanPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/verify/search`, { query: query.trim() });
      navigate(`/verify/${data.data.batchId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Batch not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-chain-dark flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-chain-border">
        <Link to="/" className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-indigo-400" />
          <span className="font-bold gradient-text">RASA-CHAIN</span>
        </Link>
        <Link to="/login" className="btn-secondary text-sm px-4 py-2">Sign In</Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6 animate-glow">
            <QrCode className="w-10 h-10 text-indigo-400" />
          </div>

          <h1 className="text-3xl font-black text-white mb-2">Verify Herbal Product</h1>
          <p className="text-gray-400 text-sm mb-8">
            Enter a Batch ID or paste QR code content to instantly verify product authenticity on blockchain.
          </p>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Batch ID (e.g. RC-1ABC2D-EFGH12)"
                className="input-field pl-12 py-4 text-base"
              />
            </div>
            <button type="submit" disabled={loading || !query.trim()} className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-base">
              {loading ? (
                <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Searching blockchain...</>
              ) : (
                <><Search className="w-5 h-5" />Verify Product</>
              )}
            </button>
          </form>

          <div className="mt-8 glass-card p-4 text-left">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">Sample Batch IDs (from seed data)</p>
            <div className="space-y-1">
              {['try any batch from /batches page'].map((id) => (
                <button key={id} onClick={() => setQuery(id)} className="text-xs text-indigo-400 hover:text-indigo-300 font-mono block">{id}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
