import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Pill
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/infoDesk.css'; // Reusing info desk styles for consistency

export default function PharmacyLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    navigate('/login', { replace: true, state: {} });
    await logout();
  };

  const navItems = [
    { path: '/pharmacy', label: 'Inventory & Dispensing', icon: <Pill size={20} />, exact: true },
  ];

  const getPageTitle = () => {
    const current = navItems.find(item =>
      item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)
    );
    return current ? current.label : 'Pharmacy Portal';
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="info-desk-layout">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="info-desk-sidebar-overlay" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`info-desk-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ color: '#8b5cf6', marginRight: '8px' }}>+</span> PMed-Aid Pharmacy
          </div>
          <button className="sidebar-close-btn" onClick={closeSidebar}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={closeSidebar}
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
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center' }}>
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h1>{getPageTitle()}</h1>
          </div>
          <div className="topbar-right">
            <div className="user-profile">
              <div className="user-avatar" style={{ background: '#8b5cf6' }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="user-info">
                <span className="user-name">{user?.first_name} {user?.last_name}</span>
                <span className="user-role">Pharmacy</span>
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
