import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Bell, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export default function AlertCenter() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    try {
      setLoading(true);
      const { data } = await api.get('/dashboard/alerts');
      setAlerts(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="id-card" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="id-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3><Bell size={20} /> Alert Center</h3>
        <span className="badge inactive">{alerts.length} Active Alerts</span>
      </div>

      <div style={{ padding: 24 }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b' }}>Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#10b981' }}>
            <CheckCircle2 size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>No active alerts. Everything is on schedule.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {alerts.map((alert, idx) => (
              <div key={idx} style={{
                display: 'flex', gap: 16, padding: 16, borderRadius: 8,
                background: alert.priority === 'high' ? '#fef2f2' : alert.priority === 'medium' ? '#fffbeb' : '#f0f9ff',
                border: `1px solid ${alert.priority === 'high' ? '#fecaca' : alert.priority === 'medium' ? '#fde68a' : '#e0f2fe'}`
              }}>
                <div style={{ color: alert.priority === 'high' ? '#ef4444' : alert.priority === 'medium' ? '#f59e0b' : '#3b82f6' }}>
                  {alert.priority === 'high' ? <AlertTriangle size={24} /> : <Info size={24} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong style={{ color: '#0f172a', fontSize: '1.1rem' }}>
                      {alert.type === 'overdue' ? 'Overdue Medication' : 'Alert'}
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>
                      {alert.minutes_overdue} mins overdue
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#334155' }}>
                    Scheduled dose of <strong>{alert.medication}</strong> was due at {new Date(alert.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                  </p>
                  {alert.patient_name && (
                    <div style={{ marginTop: 8, fontSize: '0.85rem', color: '#64748b' }}>
                      <strong>Patient:</strong> {alert.patient_name} {alert.room_number && `(Room ${alert.room_number})`}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
