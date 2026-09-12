import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  BedDouble,
  FileSignature,
  Activity,
  Receipt,
  LogOut,
  Menu,
  X,
  Pill
} from 'lucide-react';
import NotificationBell from '../common/NotificationBell';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/admin.css';
import '../../styles/infoDesk.css';

export default function InfoDeskLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    navigate('/login', { replace: true, state: {} });
    await logout();
  };

  const navItems = [
    { section: 'Main' },
    { path: '/info-desk', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { section: 'Management' },
    { path: '/info-desk/admissions', label: 'Admission Management', icon: BedDouble },
    { path: '/info-desk/prescriptions', label: 'Prescription Management', icon: FileSignature },
    { path: '/info-desk/registration', label: 'Patient Records', icon: UserPlus },
    { section: 'Monitoring' },
    { path: '/info-desk/monitoring', label: 'Patient Monitoring', icon: Activity },
  ];

  const getPageTitle = () => {
    if (location.pathname.startsWith('/info-desk/patients')) return 'Detailed Patient Record';

    const current = navItems.find(item =>
      item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)
    );
    return current ? current.label : 'Information Desk Portal';
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : 'I';

  return (
    <div className="admin-layout">
      {/* ── Mobile Sidebar Overlay ── */}
      {isSidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={closeSidebar}
        />
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
            <span>Information Desk</span>
          </div>
          <button className="sidebar-close-btn" onClick={closeSidebar}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, index) => {
            if (item.section) {
              return <div key={index} className="sidebar-section-label">{item.section}</div>;
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={closeSidebar}
                className={({ isActive }) => {
                  const isPatientRecordView = item.path === '/info-desk/registration' && location.pathname.startsWith('/info-desk/patients');
                  return `sidebar-link ${isActive || isPatientRecordView ? 'active' : ''}`;
                }}
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
              <span className="sidebar-user-role">Information Desk</span>
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
