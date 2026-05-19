import { useState } from 'react';
import { User, Save, Key, Loader2, CheckCircle } from 'lucide-react';
import { useAuth, api } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ROLE_LABELS = {
  admin: '⚡ Admin', farmer: '🌿 Farmer', manufacturer: '🏭 Manufacturer',
  lab: '🔬 Lab Analyst', regulator: '🏛️ Regulator', consumer: '👤 Consumer',
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '', phone: user?.phone || '', organization: user?.organization || '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/update-profile', profileForm);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    setChangingPw(true);
    try {
      await api.post('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="page-container max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-8">Profile & Settings</h1>

      {/* Profile Card */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-black">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-bold text-white">{user?.name}</p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full mt-1 inline-block">
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
          </div>
          {user?.isVerified && (
            <div className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle className="w-4 h-4" /> Verified
            </div>
          )}
        </div>

        <form onSubmit={saveProfile} className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">Profile Information</h3>
          <div>
            <label className="input-label">Full Name</label>
            <input value={profileForm.name} onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="input-label">Phone</label>
            <input value={profileForm.phone} onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))} className="input-field" placeholder="+91-XXXXXXXXXX" />
          </div>
          <div>
            <label className="input-label">Organization</label>
            <input value={profileForm.organization} onChange={(e) => setProfileForm(p => ({ ...p, organization: e.target.value }))} className="input-field" placeholder="Your company or farm" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-400" />
          Change Password
        </h3>
        <form onSubmit={changePassword} className="space-y-4">
          {[
            ['currentPassword', 'Current Password'],
            ['newPassword', 'New Password'],
            ['confirmPassword', 'Confirm New Password'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="input-label">{label}</label>
              <input type="password" value={pwForm[key]} onChange={(e) => setPwForm(p => ({ ...p, [key]: e.target.value }))} className="input-field" placeholder="••••••••" minLength={key !== 'currentPassword' ? 6 : 1} />
            </div>
          ))}
          <button type="submit" disabled={changingPw} className="btn-secondary flex items-center gap-2">
            {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            {changingPw ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
