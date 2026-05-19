import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import PublicLayout from './layouts/PublicLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import BatchesPage from './pages/batches/BatchesPage';
import CreateBatchPage from './pages/batches/CreateBatchPage';
import BatchDetailPage from './pages/batches/BatchDetailPage';
import BlockchainExplorerPage from './pages/blockchain/BlockchainExplorerPage';
import VerifyPage from './pages/verify/VerifyPage';
import QRScanPage from './pages/verify/QRScanPage';
import ReportsPage from './pages/reports/ReportsPage';
import AuditLogsPage from './pages/audit/AuditLogsPage';
import UsersPage from './pages/admin/UsersPage';
import ProfilePage from './pages/profile/ProfilePage';
import SensorPage from './pages/sensor/SensorPage';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route
function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />
        <Route path="/verify/:batchId" element={<VerifyPage />} />
        <Route path="/verify" element={<QRScanPage />} />
      </Route>

      {/* Protected App Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/batches" element={<BatchesPage />} />
        <Route path="/batches/create" element={
          <ProtectedRoute roles={['manufacturer', 'farmer', 'admin']}>
            <CreateBatchPage />
          </ProtectedRoute>
        } />
        <Route path="/batches/:id" element={<BatchDetailPage />} />
        <Route path="/blockchain" element={<BlockchainExplorerPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/sensor" element={
          <ProtectedRoute roles={['lab', 'manufacturer', 'admin']}>
            <SensorPage />
          </ProtectedRoute>
        } />
        <Route path="/audit" element={
          <ProtectedRoute roles={['admin', 'regulator']}>
            <AuditLogsPage />
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute roles={['admin']}>
            <UsersPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
