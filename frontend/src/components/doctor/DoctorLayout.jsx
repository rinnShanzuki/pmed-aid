import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Stethoscope,
  FileSignature,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import NotificationBell from '../common/NotificationBell';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/admin.css';
import '../../styles/doctor.css';

export default function DoctorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    navigate('/login', { replace: true, state: {} });
    await logout();
  };

  const navItems = [
    { path: '/doctor', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/doctor/consultations', label: 'Consultations', icon: Stethoscope },
    { path: '/doctor/patients', label: 'My Patients', icon: Activity },
    { path: '/doctor/prescriptions', label: 'Prescriptions', icon: FileSignature },
  ];

  const getPageTitle = () => {
    if (location.pathname.match(/^\/doctor\/patients\/\d+/)) return 'Detailed Patient Record';

    const current = navItems.find(item =>
      item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path) && !item.exact
    );
    return current ? current.label : 'Doctor Portal';
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : 'D';

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
            <span>Doctor Portal</span>
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
                className={({ isActive }) => {
                  const isPatientRecordView = item.path === '/doctor/patients' && location.pathname.startsWith('/doctor/patients');
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
                Dr. {user?.last_name}
              </span>
              <span className="sidebar-user-role">Doctor</span>
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
