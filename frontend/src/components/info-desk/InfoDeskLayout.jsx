import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  BedDouble,
  FileSignature,
  Activity,
  Receipt,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/infoDesk.css';

export default function InfoDeskLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/info-desk', label: 'Dashboard', icon: <LayoutDashboard size={20} />, exact: true },
    { path: '/info-desk/admissions', label: 'Admission Management', icon: <BedDouble size={20} /> },
    { path: '/info-desk/monitoring', label: 'Patient Monitoring', icon: <Activity size={20} /> },
    { path: '/info-desk/registration', label: 'Patient Records', icon: <UserPlus size={20} /> },
    { path: '/info-desk/prescriptions', label: 'Prescription Management', icon: <FileSignature size={20} /> },
    { path: '/info-desk/billing', label: 'Billing Management', icon: <Receipt size={20} /> },
  ];

  const getPageTitle = () => {
    const current = navItems.find(item =>
      item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)
    );
    return current ? current.label : 'Information Desk Portal';
  };

  return (
    <div className="info-desk-layout">
      {/* Sidebar */}
      <aside className="info-desk-sidebar">
        <div className="sidebar-header">
          <span style={{ color: '#38bdf8', marginRight: '8px' }}>+</span> PMed-Aid
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="info-desk-main">
        <header className="topbar">
          <div className="topbar-left">
            <h1>{getPageTitle()}</h1>
          </div>
          <div className="topbar-right">
            <div className="user-profile">
              <div className="user-avatar">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="user-info">
                <span className="user-name">{user?.first_name} {user?.last_name}</span>
                <span className="user-role">Information Desk</span>
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
