import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Users, UserCog, Pill, BarChart3,
  Settings, LogOut, Activity, Menu, X
} from 'lucide-react';
import NotificationBell from '../common/NotificationBell';
import '../../styles/admin.css';

const navItems = [
  { section: 'Main' },
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { section: 'Management' },
  { to: '/admin/users', icon: UserCog, label: 'Users' },
  { to: '/admin/patients', icon: Users, label: 'Patients' },
  { section: 'Insights' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { section: 'Configuration' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : 'A';

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  // Close sidebar on route change for mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="admin-layout">
      {/* ── Mobile Sidebar Overlay ── */}
      {isSidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
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
            <span>Admin Portal</span>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, i) =>
            item.section ? (
              <div key={i} className="sidebar-section-label">{item.section}</div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                <item.icon />
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="sidebar-user-role">{user?.role?.replace('_', ' ')}</span>
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
            {/* Page title injected by child routes if needed */}
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
