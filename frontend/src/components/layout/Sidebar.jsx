import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Link2, QrCode, FileText,
  Activity, Users, Settings, LogOut, ChevronRight,
  Cpu, Shield, Leaf
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: null },
  { to: '/batches', icon: Package, label: 'Batches', roles: null },
  { to: '/blockchain', icon: Link2, label: 'Blockchain Explorer', roles: null },
  { to: '/verify', icon: QrCode, label: 'QR Verify', roles: null },
  { to: '/reports', icon: FileText, label: 'Reports', roles: null },
  { to: '/sensor', icon: Cpu, label: 'Sensor Data', roles: ['lab', 'manufacturer', 'admin'] },
  { to: '/audit', icon: Shield, label: 'Audit Logs', roles: ['admin', 'regulator'] },
  { to: '/users', icon: Users, label: 'User Management', roles: ['admin'] },
];

const roleColors = {
  admin: 'text-red-400 bg-red-400/10',
  farmer: 'text-green-400 bg-green-400/10',
  manufacturer: 'text-blue-400 bg-blue-400/10',
  lab: 'text-purple-400 bg-purple-400/10',
  regulator: 'text-amber-400 bg-amber-400/10',
  consumer: 'text-gray-400 bg-gray-400/10',
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 flex flex-col
        bg-chain-card border-r border-chain-border
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-chain-border">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-neon">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold gradient-text">RASA-CHAIN</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Herbal Traceability</p>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-chain-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${roleColors[user?.role] || 'text-gray-400 bg-gray-400/10'}`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest px-3 mb-2">Navigation</p>
        {filteredNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-sm">{item.label}</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-chain-border space-y-1">
        <NavLink to="/profile" onClick={onClose} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Settings className="w-4 h-4" />
          <span className="text-sm">Profile & Settings</span>
        </NavLink>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
