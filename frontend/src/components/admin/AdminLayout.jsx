import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Users, UserCog, Pill, BarChart3,
  Settings, LogOut, Activity
} from 'lucide-react';
import '../../styles/admin.css';

const navItems = [
  { section: 'Main' },
  { to: '/admin',              icon: LayoutDashboard, label: 'Dashboard',   end: true },
  { section: 'Management' },
  { to: '/admin/users',        icon: UserCog,         label: 'Users' },
  { to: '/admin/patients',     icon: Users,           label: 'Patients' },
  { to: '/admin/medications',  icon: Pill,            label: 'Medications' },
  { section: 'Insights' },
  { to: '/admin/reports',      icon: BarChart3,       label: 'Reports' },
  { section: 'Configuration' },
  { to: '/admin/settings',     icon: Settings,        label: 'Settings' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : 'A';

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="admin-layout">
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Activity />
          </div>
          <div className="sidebar-brand-text">
            <h1>PMed-Aid</h1>
            <span>Admin Panel</span>
          </div>
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
            {/* Page title injected by child routes if needed */}
          </div>
          <div className="admin-topbar-right">
            <button className="btn-logout" onClick={handleLogout}>
              <LogOut size={16} />
              Log Out
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
