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
import { useAuth } from '../../hooks/useAuth';
import '../../styles/patient.css';

export default function PatientLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/patient', label: 'Dashboard', mobileLabel: 'Home', icon: <LayoutDashboard size={20} />, exact: true },
    { path: '/patient/schedule', label: 'Medication Schedule', mobileLabel: 'Meds', icon: <Calendar size={20} /> },
    { path: '/patient/prescriptions', label: 'Prescription List View', mobileLabel: 'Rx', icon: <FileText size={20} /> },
    { path: '/patient/history', label: 'Adherence History', mobileLabel: 'History', icon: <Activity size={20} /> },
  ];

  const getPageTitle = () => {
    const current = navItems.find(item =>
      item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path) && !item.exact
    );
    return current ? current.label : 'Patient Portal';
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="patient-layout">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="patient-sidebar-overlay" onClick={closeSidebar} />
      )}

      {/* Desktop Sidebar */}
      <aside className={`patient-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ color: '#10b981', marginRight: '8px' }}>+</span> PMed-Aid
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
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>
      
      <main className="patient-main">
        <header className="topbar">
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center' }}>
            <h1>{getPageTitle()}</h1>
          </div>
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className="patient-bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.mobileLabel}</span>
          </NavLink>
        ))}
        <button className="bottom-nav-item bottom-nav-logout" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Out</span>
        </button>
      </nav>
    </div>
  );
}
