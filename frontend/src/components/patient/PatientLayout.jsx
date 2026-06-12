import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Activity,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/patient.css';

export default function PatientLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/patient', label: 'Patient Dashboard', icon: <LayoutDashboard size={20} />, exact: true },
    { path: '/patient/schedule', label: 'Medication Schedule', icon: <Calendar size={20} /> },
    { path: '/patient/prescriptions', label: 'Prescription List View', icon: <FileText size={20} /> },
    { path: '/patient/history', label: 'Adherence History', icon: <Activity size={20} /> },
  ];

  const getPageTitle = () => {
    const current = navItems.find(item =>
      item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path) && !item.exact
    );
    return current ? current.label : 'Patient Portal';
  };

  return (
    <div className="patient-layout">
      <aside className="patient-sidebar">
        <div className="sidebar-header">
          <span style={{ color: '#10b981', marginRight: '8px' }}>+</span> PMed-Aid
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              {item.icon}{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>
      <main className="patient-main">
        <header className="topbar">
          <div className="topbar-left"><h1>{getPageTitle()}</h1></div>
          <div className="topbar-right">
            <div className="user-profile">
              <div className="user-avatar patient-avatar">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="user-info">
                <span className="user-name">{user?.first_name} {user?.last_name}</span>
                <span className="user-role">Patient</span>
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
