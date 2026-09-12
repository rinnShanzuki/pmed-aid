import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=10');
      setNotifications(res.data.data);
      setUnreadCount(res.data.meta.unread_count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Polling every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all read:', error);
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.is_read) {
      handleMarkAsRead(n.id);
    }
    setIsOpen(false);

    if (n.title.includes('Consultation') || n.title.includes('Assigned')) {
      navigate('/doctor/consultations');
    } else if (n.title.includes('Admission')) {
      navigate('/info-desk/admissions');
    } else if (n.type === 'overdue' || n.type === 'missed_dose' || n.title.includes('Overdue') || n.title.includes('Missed')) {
      navigate('/nurse/monitoring');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc2626';
      case 'low': return '#16a34a';
      default: return '#2563eb';
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        className="topbar-icon-btn" 
        onClick={() => setIsOpen(!isOpen)} 
        title="Notifications"
        style={{ position: 'relative' }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0',
            right: '0',
            backgroundColor: '#dc2626',
            color: 'white',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            borderRadius: '50%',
            padding: '2px 5px',
            transform: 'translate(30%, -30%)',
            boxShadow: '0 0 0 2px white'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          marginTop: '0.5rem',
          width: '320px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '400px'
        }}>
          <div style={{ 
            padding: '12px 16px', 
            borderBottom: '1px solid #e5e7eb', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#111827' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                style={{
                  background: 'none', border: 'none', color: '#2563eb', fontSize: '0.8rem', cursor: 'pointer', padding: 0
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    onClick={() => handleNotificationClick(notification)}
                    style={{ 
                      padding: '12px 16px', 
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: notification.is_read ? '#fff' : '#eff6ff',
                      display: 'flex',
                      gap: '12px',
                      transition: 'background-color 0.2s',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                  >
                  <div style={{ flexShrink: 0, marginTop: '2px' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: getPriorityColor(notification.priority),
                      marginTop: '6px'
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: notification.is_read ? '500' : '600', color: '#111827' }}>
                        {notification.title}
                      </h4>
                      {!notification.is_read && (
                        <button 
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          title="Mark as read"
                          style={{
                            background: 'none', border: 'none', padding: '2px', color: '#9ca3af', cursor: 'pointer'
                          }}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                    </div>
                    <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#4b5563', lineHeight: '1.4' }}>
                      {notification.message}
                    </p>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#9ca3af' }}>
                      <Clock size={12} />
                      {new Date(notification.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
