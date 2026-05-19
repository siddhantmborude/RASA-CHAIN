import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const roles = [
  { value: 'farmer', label: '🌿 Farmer / Supplier' },
  { value: 'manufacturer', label: '🏭 Manufacturer' },
  { value: 'lab', label: '🔬 Quality Lab' },
  { value: 'regulator', label: '🏛️ Regulator' },
  { value: 'consumer', label: '👤 Consumer' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'consumer', organization: '', phone: '', licenseNumber: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData);
      toast.success('Account created! Welcome to RASA-CHAIN.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const update = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-neon">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black gradient-text">RASA-CHAIN</span>
        </div>

        <div className="glass-card p-8">
          <h1 className="text-2xl font-black text-white mb-1">Create Account</h1>
          <p className="text-gray-400 text-sm mb-6">Join the herbal supply chain network</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="input-label">Full Name *</label>
                <input value={formData.name} onChange={(e) => update('name', e.target.value)} className="input-field" placeholder="Your full name" required />
              </div>
              <div className="col-span-2">
                <label className="input-label">Email Address *</label>
                <input type="email" value={formData.email} onChange={(e) => update('email', e.target.value)} className="input-field" placeholder="you@example.com" required />
              </div>
              <div className="col-span-2">
                <label className="input-label">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => update('password', e.target.value)}
                    className="input-field pr-12"
                    placeholder="Min. 6 characters"
                    minLength={6}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="col-span-2">
                <label className="input-label">Role *</label>
                <select value={formData.role} onChange={(e) => update('role', e.target.value)} className="input-field">
                  {roles.map((r) => <option key={r.value} value={r.value} style={{ background: '#111128' }}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Organization</label>
                <input value={formData.organization} onChange={(e) => update('organization', e.target.value)} className="input-field" placeholder="Company / Farm name" />
              </div>
              <div>
                <label className="input-label">Phone</label>
                <input value={formData.phone} onChange={(e) => update('phone', e.target.value)} className="input-field" placeholder="+91-XXXXXXXXXX" />
              </div>
              {['manufacturer', 'lab', 'farmer', 'regulator'].includes(formData.role) && (
                <div className="col-span-2">
                  <label className="input-label">License Number</label>
                  <input value={formData.licenseNumber} onChange={(e) => update('licenseNumber', e.target.value)} className="input-field" placeholder="License / Registration number" />
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
