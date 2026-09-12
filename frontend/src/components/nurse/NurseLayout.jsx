import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ScanLine,
  Activity,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import NotificationBell from '../common/NotificationBell';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/admin.css';
import '../../styles/nurse.css';

export default function NurseLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const closeSidebar = () => setIsSidebarOpen(false);

  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleLogout = async () => {
    navigate('/login', { replace: true, state: {} });
    await logout();
  };

  const navItems = [
    { path: '/nurse', label: 'Nurse Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/nurse/scanner', label: 'QR Scanner', icon: ScanLine },
    { path: '/nurse/patients', label: 'Patient Monitoring', icon: Users },
    { path: '/nurse/monitoring', label: 'Medication Schedule Monitoring', icon: Activity },
  ];

  const getPageTitle = () => {
    const current = navItems.find(item =>
      item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path) && !item.exact
    );
    return current ? current.label : 'Nurse Portal';
  };

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : 'N';

  return (
    <div className="admin-layout">
      {/* ── Mobile Sidebar Overlay ── */}
      {isSidebarOpen && (
        <div className="admin-sidebar-overlay" onClick={closeSidebar} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon" style={{ background: 'transparent', padding: 0, width: '46px', height: '46px' }}>
            <img
              src="/pmed-logo.png"
              alt="PMed-Aid Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 8px rgba(255,255,255,0.2))'
              }}
            />
          </div>
          <div className="sidebar-brand-text">
            <h1>PMed-Aid</h1>
            <span>Nurse Portal</span>
          </div>
          <button className="sidebar-close-btn" onClick={closeSidebar}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={closeSidebar}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="sidebar-user-role">Nurse</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="topbar-icon-btn mobile-menu-btn"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--admin-text)' }}>{getPageTitle()}</h2>
          </div>
          <div className="admin-topbar-right">
            {deferredPrompt && (
              <button className="topbar-icon-btn" onClick={handleInstallClick} title="Install App">
                <LayoutDashboard size={18} />
              </button>
            )}
            <NotificationBell />
            <button className="topbar-icon-btn logout" onClick={handleLogout} title="Log Out">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
