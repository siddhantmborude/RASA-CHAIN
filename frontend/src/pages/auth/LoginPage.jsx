import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { role: 'Admin', email: 'admin@rasa-chain.io', password: 'Admin@123', color: 'text-red-400' },
    { role: 'Manufacturer', email: 'manufacturer@rasa-chain.io', password: 'Mfg@123', color: 'text-blue-400' },
    { role: 'Farmer', email: 'farmer@rasa-chain.io', password: 'Farmer@123', color: 'text-green-400' },
    { role: 'Lab', email: 'lab@rasa-chain.io', password: 'Lab@123', color: 'text-purple-400' },
    { role: 'Regulator', email: 'regulator@rasa-chain.io', password: 'Reg@123', color: 'text-amber-400' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (account) => {
    setFormData({ email: account.email, password: account.password });
    setLoading(true);
    try {
      await login(account.email, account.password);
      toast.success(`Logged in as ${account.role}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-r border-white/[0.06] p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-neon">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black gradient-text">RASA-CHAIN</span>
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Herbal Supply Chain
            <br />
            on the Blockchain
          </h2>
          <p className="text-gray-400 leading-relaxed">
            Immutable traceability for every Ayurvedic product — from harvest to consumer hands.
          </p>
        </div>
        <div className="relative glass-card p-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Latest Blockchain Record</p>
          <p className="font-mono text-xs text-indigo-400">0x7f3a9c2e1b8d4f56a0e2...</p>
          <p className="text-xs text-gray-400 mt-1">Ashwagandha Batch · Verified ✓</p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-black gradient-text">RASA-CHAIN</span>
          </div>

          <h1 className="text-3xl font-black text-white mb-2">Sign In</h1>
          <p className="text-gray-400 text-sm mb-8">Welcome back to the supply chain</p>

          {/* Demo Quick Login */}
          <div className="mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Quick Demo Login</p>
            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  onClick={() => quickLogin(acc)}
                  disabled={loading}
                  className="glass-card px-2 py-2 text-center hover:border-white/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <p className={`text-xs font-bold ${acc.color}`}>{acc.role}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="divider mb-6" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="input-field pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
