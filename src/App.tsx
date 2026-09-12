import { EmailAlertDashboard } from './pages/EmailAlertDashboard';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessManagementPage } from './pages/AccessManagementPage';
import { AppNavbar } from './components/AppNavbar';
import { AnalyticsPage } from './pages/AnalyticsPage';

function ProtectedApp() {
  const { loading, isAuthenticated, hasPermission } = useAuth();
  if (loading) return <div className="p-8 text-slate-700">Loading...</div>;
  if (!isAuthenticated || !hasPermission('ALERT_VIEW')) {
    if (window.location.pathname !== '/login') window.location.assign('/login');
    return null;
  }
  return <>
    <AppNavbar />
    <div className="min-h-[calc(100vh-73px)] bg-slate-100">
      {window.location.pathname === '/admin/access' ? <AccessManagementPage /> : window.location.pathname === '/analytics' ? <AnalyticsPage /> : <EmailAlertDashboard />}
    </div>
  </>;
}

export default function App() {
  return <AuthProvider>{window.location.pathname === '/login' ? <LoginPage /> : <ProtectedApp />}</AuthProvider>;
}
