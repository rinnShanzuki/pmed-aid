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
import { useAuth } from '../../hooks/useAuth';
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
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/nurse', label: 'Nurse Dashboard', icon: <LayoutDashboard size={20} />, exact: true },
    { path: '/nurse/scanner', label: 'QR Scanner', icon: <ScanLine size={20} /> },
    { path: '/nurse/patients', label: 'Patient Monitoring', icon: <Users size={20} /> },
    { path: '/nurse/monitoring', label: 'Medication Schedule Monitoring', icon: <Activity size={20} /> },
  ];

  const getPageTitle = () => {
    const current = navItems.find(item =>
      item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path) && !item.exact
    );
    return current ? current.label : 'Nurse Portal';
  };

  return (
    <div className="nurse-layout">
      {isSidebarOpen && (
        <div className="nurse-sidebar-overlay" onClick={closeSidebar} />
      )}
      <aside className={`nurse-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ color: '#38bdf8', marginRight: '8px' }}>+</span> PMed-Aid
          </div>
          <button className="sidebar-close-btn" onClick={closeSidebar}>
            <X size={24} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.exact}
              onClick={closeSidebar}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              {item.icon}{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {deferredPrompt && (
            <button onClick={handleInstallClick} className="logout-btn" style={{ background: '#3b82f6', color: '#fff' }}>
              <LayoutDashboard size={18} /> Install App
            </button>
          )}
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>
      <main className="nurse-main">
        <header className="topbar">
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center' }}>
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h1>{getPageTitle()}</h1>
          </div>
          <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {deferredPrompt && (
              <button onClick={handleInstallClick} className="mobile-only-btn" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'none' }} title="Install App">
                <LayoutDashboard size={18} />
              </button>
            )}
            <button onClick={handleLogout} className="mobile-only-btn" style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'none' }} title="Sign Out">
              <LogOut size={18} />
            </button>
            <div className="user-profile">
              <div className="user-avatar nurse-avatar">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="user-info">
                <span className="user-name">{user?.first_name} {user?.last_name}</span>
                <span className="user-role">Nurse</span>
              </div>
            </div>
          </div>
        </header>
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
