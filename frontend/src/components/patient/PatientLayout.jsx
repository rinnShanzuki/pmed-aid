import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Activity,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import NotificationBell from '../common/NotificationBell';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/admin.css';
import '../../styles/patient.css';

export default function PatientLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    navigate('/login', { replace: true, state: {} });
    await logout();
  };

  const navItems = [
    { path: '/patient', label: 'Dashboard', mobileLabel: 'Home', icon: LayoutDashboard, exact: true },
    { path: '/patient/schedule', label: 'Medication Schedule', mobileLabel: 'Meds', icon: Calendar },
    { path: '/patient/prescriptions', label: 'Prescription List View', mobileLabel: 'Rx', icon: FileText },
    { path: '/patient/history', label: 'Adherence History', mobileLabel: 'History', icon: Activity },
  ];

  const getPageTitle = () => {
    const current = navItems.find(item =>
      item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path) && !item.exact
    );
    return current ? current.label : 'Patient Portal';
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : 'P';

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
            <span>Patient Portal</span>
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
              <span className="sidebar-user-role">Patient</span>
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className="patient-bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.mobileLabel}</span>
            </NavLink>
          );
        })}
        <button className="bottom-nav-item bottom-nav-logout" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Out</span>
        </button>
      </nav>
    </div>
  );
}
