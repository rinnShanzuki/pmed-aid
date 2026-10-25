import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../hooks/useAuth';

export function getNotificationRoute(notification, role = 'patient') {
  if (!notification) return { path: role === 'info_desk' ? '/info-desk' : `/${role}`, state: {} };

  const title = (notification.title || '').toLowerCase();
  const message = (notification.message || '').toLowerCase();
  const type = (notification.type || '').toLowerCase();
  const pId = notification.related_prescription_id;
  const aId = notification.related_admission_id;
  const cId = notification.related_consultation_id;
  const sId = notification.related_schedule_id;

  // 1. Admission Required / Admission Request
  if (
    title.includes('admission required') ||
    title.includes('admission request') ||
    title.includes('admission') ||
    message.includes('requested admission') ||
    message.includes('assign a room') ||
    message.includes('requires admission')
  ) {
    if (!title.includes('discharge') && !message.includes('discharge')) {
      if (role === 'info_desk' || role === 'admin') {
        return {
          path: '/info-desk/admissions?tab=pending_admissions',
          state: { tab: 'pending_admissions', targetConsultationId: cId, targetAdmissionId: aId }
        };
      }
      if (role === 'doctor') return { path: '/doctor/patients', state: {} };
      if (role === 'nurse') return { path: '/nurse/patients', state: {} };
      return { path: '/patient', state: {} };
    }
  }

  // 2. Discharge requested / approved
  if (title.includes('discharge') || message.includes('discharge')) {
    if (role === 'info_desk' || role === 'admin') {
      return {
        path: '/info-desk/admissions?tab=admitted',
        state: { tab: 'admitted', targetAdmissionId: aId }
      };
    }
    if (role === 'patient') {
      return { path: '/patient/qr', state: {} };
    }
    if (role === 'doctor') return { path: '/doctor/patients', state: {} };
    if (role === 'nurse') return { path: '/nurse/patients', state: {} };
  }

  // 3. Outpatient Consultation Completed
  if (title.includes('outpatient consultation completed') || message.includes('outpatient consultation')) {
    if (role === 'info_desk' || role === 'admin') {
      return {
        path: '/info-desk/admissions?tab=outpatient',
        state: { tab: 'outpatient', targetConsultationId: cId }
      };
    }
    if (role === 'doctor') return { path: '/doctor/consultations', state: {} };
  }

  // 4. Consultation Queue / Arrivals / New Consultation / Assigned Doctor
  if (title.includes('consultation') || title.includes('queue') || title.includes('assigned')) {
    if (role === 'doctor') return { path: '/doctor/consultations', state: {} };
    if (role === 'nurse') return { path: '/nurse/patients', state: {} };
    if (role === 'info_desk' || role === 'admin') {
      return {
        path: '/info-desk/admissions?tab=arrivals',
        state: { tab: 'arrivals', targetConsultationId: cId }
      };
    }
  }

  // 5. Prescription Handover
  if (title.includes('handover') || message.includes('handover') || message.includes('handed over')) {
    if (role === 'info_desk' || role === 'admin') {
      return {
        path: '/info-desk/prescriptions?modal=handover',
        state: { modal: 'handover', viewPrescriptionId: pId }
      };
    }
    if (role === 'doctor') return { path: '/doctor/prescriptions', state: {} };
  }

  // 6. Prescriptions (ready for QR, take-home, updated, created)
  if (title.includes('prescription') || message.includes('prescription')) {
    if (role === 'info_desk' || role === 'admin') {
      const isOutpatient = title.includes('take-home') || message.includes('take-home') || message.includes('outpatient');
      const tab = isOutpatient ? 'outpatient' : 'inpatient';
      const q = pId ? `?tab=${tab}&viewPrescriptionId=${pId}` : `?tab=${tab}`;
      return {
        path: `/info-desk/prescriptions${q}`,
        state: { tab, viewPrescriptionId: pId }
      };
    }
    if (role === 'doctor') {
      return { path: '/doctor/prescriptions', state: { viewPrescriptionId: pId } };
    }
    if (role === 'patient') {
      return { path: '/patient/prescriptions', state: { viewPrescriptionId: pId } };
    }
    if (role === 'nurse') {
      return { path: '/nurse/administration', state: {} };
    }
  }

  // 7. Medication administered / Patient confirmed medication
  if (
    title.includes('medication administered') ||
    title.includes('confirmed medication') ||
    message.includes('received') ||
    message.includes('dose confirmed') ||
    message.includes('confirmed taking')
  ) {
    if (role === 'nurse') return { path: '/nurse/monitoring', state: { scheduleId: sId } };
    if (role === 'info_desk' || role === 'admin') return { path: '/info-desk/monitoring', state: { scheduleId: sId } };
    if (role === 'patient') return { path: '/patient/history', state: {} };
    if (role === 'doctor') return { path: '/doctor/patients', state: {} };
  }

  // 8. Missed Medication, Overdue, Alerts
  if (
    type === 'missed_dose' ||
    type === 'overdue' ||
    title.includes('missed') ||
    title.includes('overdue') ||
    title.includes('escalation')
  ) {
    if (role === 'nurse') return { path: '/nurse/alerts', state: { scheduleId: sId } };
    if (role === 'info_desk' || role === 'admin') return { path: '/info-desk/monitoring', state: { scheduleId: sId } };
    if (role === 'doctor') return { path: '/doctor/patients', state: {} };
    if (role === 'patient') return { path: '/patient/schedule', state: {} };
  }

  // 9. Staff User / Patient Registration / System Settings
  if (title.includes('user') || title.includes('staff')) {
    if (role === 'admin') return { path: '/admin/users', state: {} };
  }
  if (title.includes('patient registered') || title.includes('new patient')) {
    if (role === 'admin') return { path: '/admin/patients', state: {} };
    if (role === 'info_desk') return { path: '/info-desk/registration', state: {} };
  }
  if (title.includes('system settings') || title.includes('settings')) {
    if (role === 'admin') return { path: '/admin/settings', state: {} };
  }

  // Fallback by role
  const prefix = role === 'info_desk' ? '/info-desk' : `/${role}`;
  return { path: prefix, state: {} };
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { socket } = useSocket();
  const { user } = useAuth();

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

    if (!socket) return;

    const handleNewNotification = (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev].slice(0, 10));
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket]);

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

    const role = user?.role || 'patient';
    const target = getNotificationRoute(n, role);
    if (target?.path) {
      navigate(target.path, { state: { ...(target.state || {}), _ts: Date.now() } });
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = notification.is_read ? '#f8fafc' : '#dbeafe';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notification.is_read ? '#fff' : '#eff6ff';
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
