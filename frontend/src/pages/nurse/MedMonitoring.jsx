import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Activity, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export default function MedMonitoring() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      setLoading(true);
      const { data } = await api.get('/dashboard/medication-status');
      setSchedules(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const now = new Date();
  const allMeds = schedules.flatMap(p =>
    p.schedules.map(s => ({
      ...s,
      patient_name: p.patient_name,
      room_number: p.room_number,
      isOverdue: s.status === 'pending' && new Date(s.scheduled_time) < now,
      isDueSoon: s.status === 'pending' && new Date(s.scheduled_time) >= now,
    }))
  );

  const overdue = allMeds.filter(m => m.isOverdue).sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));
  const dueSoon = allMeds.filter(m => m.isDueSoon).sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));

  return (
    <div style={{ padding: '8px', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{`
        .med-monitoring-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }
        @media (max-width: 1024px) {
          .med-monitoring-grid {
            grid-template-columns: 1fr;
          }
        }
        .monitor-card {
          background: white;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .monitor-card-header {
          padding: 24px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e2e8f0;
        }
        .med-item {
          background: white;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.2s ease;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          position: relative;
          overflow: hidden;
        }
        .med-item:hover {
          box-shadow: 0 12px 20px -5px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
        .med-item.overdue::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          background: #ef4444;
        }
        .med-item.due-soon::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          background: #f59e0b;
        }
      `}</style>



      <div className="med-monitoring-grid">

        {/* OVERDUE COLUMN */}
        <div className="monitor-card">
          <div className="monitor-card-header" style={{ background: '#fef2f2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 8, background: '#fee2e2', color: '#dc2626', borderRadius: 12 }}>
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ margin: 0, color: '#991b1b', fontSize: '1.25rem', fontWeight: 700 }}>Overdue Medications</h3>
            </div>
            <div style={{ background: '#dc2626', color: 'white', padding: '4px 12px', borderRadius: 9999, fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)' }}>
              {overdue.length}
            </div>
          </div>

          <div style={{ padding: 32, flex: 1, background: '#fafafa' }}>
            {loading ? <p style={{ textAlign: 'center', color: '#94a3b8' }}>Loading schedules...</p> : overdue.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200, color: '#10b981' }}>
                <div style={{ width: 80, height: 80, background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <CheckCircle size={40} />
                </div>
                <h4 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: '#065f46' }}>All Clear!</h4>
                <p style={{ margin: 0, color: '#059669', fontWeight: 500 }}>No overdue medications. Great job!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {overdue.map(m => (
                  <div key={m.id} className="med-item overdue">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: '0 0 6px', fontSize: '1.2rem', color: '#0f172a', fontWeight: 700 }}>{m.medication_name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#0f172a', fontWeight: 600 }}>{m.patient_name}</span>
                          <span style={{ color: '#cbd5e1' }}>|</span>
                          <span style={{ color: '#64748b' }}>Room {m.room_number || 'N/A'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontWeight: 700, fontSize: '1.1rem', background: '#fee2e2', padding: '4px 12px', borderRadius: 8 }}>
                          <Clock size={16} />
                          {new Date(m.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Past Due</span>
                      </div>
                    </div>

                    <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }}></div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#475569', fontSize: '0.95rem' }}>
                      <div><strong>Dosage:</strong> {m.dosage}</div>
                      <div><strong>Route:</strong> {m.route ? m.route.replace('_', ' ') : 'N/A'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* DUE SOON COLUMN */}
        <div className="monitor-card">
          <div className="monitor-card-header" style={{ background: '#fffbeb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 8, background: '#fef3c7', color: '#d97706', borderRadius: 12 }}>
                <Clock size={24} />
              </div>
              <h3 style={{ margin: 0, color: '#b45309', fontSize: '1.25rem', fontWeight: 700 }}>Due Soon</h3>
            </div>
            <div style={{ background: '#f59e0b', color: 'white', padding: '4px 12px', borderRadius: 9999, fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)' }}>
              {dueSoon.length}
            </div>
          </div>

          <div style={{ padding: 32, flex: 1, background: '#fafafa' }}>
            {loading ? <p style={{ textAlign: 'center', color: '#94a3b8' }}>Loading schedules...</p> : dueSoon.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200, color: '#94a3b8' }}>
                <div style={{ width: 80, height: 80, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Clock size={40} />
                </div>
                <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 500 }}>No medications due in the near future.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {dueSoon.map(m => (
                  <div key={m.id} className="med-item due-soon">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: '0 0 6px', fontSize: '1.2rem', color: '#0f172a', fontWeight: 700 }}>{m.medication_name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#0f172a', fontWeight: 600 }}>{m.patient_name}</span>
                          <span style={{ color: '#cbd5e1' }}>|</span>
                          <span style={{ color: '#64748b' }}>Room {m.room_number || 'N/A'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#d97706', fontWeight: 700, fontSize: '1.1rem', background: '#fef3c7', padding: '4px 12px', borderRadius: 8 }}>
                          <Clock size={16} />
                          {new Date(m.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#d97706', marginTop: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upcoming</span>
                      </div>
                    </div>

                    <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }}></div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#475569', fontSize: '0.95rem' }}>
                      <div><strong>Dosage:</strong> {m.dosage}</div>
                      <div><strong>Route:</strong> {m.route ? m.route.replace('_', ' ') : 'N/A'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
