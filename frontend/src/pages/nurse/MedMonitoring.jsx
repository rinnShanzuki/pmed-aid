import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Activity, AlertTriangle, Clock } from 'lucide-react';

export default function MedMonitoring() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      setLoading(true);
      // Fetch today's schedules
      const { data } = await api.get('/dashboard/medication-status');
      setSchedules(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Flatten and categorize
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
    <div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 48, height: 48, background: '#ea580c', color: 'white', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Activity size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Medication Monitoring</h2>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Real-time tracking of pending medications across the ward.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        
        {/* OVERDUE */}
        <div className="id-card" style={{ borderTop: '4px solid #ef4444' }}>
          <div className="id-section-header">
            <h3 style={{ color: '#dc2626' }}><AlertTriangle size={20} /> Overdue Medications</h3>
            <span className="badge inactive">{overdue.length}</span>
          </div>
          {loading ? <p style={{ padding: 24, textAlign: 'center' }}>Loading...</p> : overdue.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#10b981' }}>
              <CheckCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>No overdue medications! Great job.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 0 16px 0' }}>
              {overdue.map(m => (
                <div key={m.id} style={{ padding: 16, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong style={{ color: '#991b1b', fontSize: '1.1rem' }}>{m.medication_name}</strong>
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>
                      {new Date(m.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ color: '#b91c1c', fontSize: '0.9rem' }}>
                    <strong>{m.patient_name}</strong> — Room {m.room_number || 'N/A'}
                  </div>
                  <div style={{ color: '#b91c1c', fontSize: '0.85rem', marginTop: 4 }}>
                    Dosage: {m.dosage}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DUE SOON */}
        <div className="id-card" style={{ borderTop: '4px solid #eab308' }}>
          <div className="id-section-header">
            <h3 style={{ color: '#ca8a04' }}><Clock size={20} /> Due Soon</h3>
            <span className="badge pending">{dueSoon.length}</span>
          </div>
          {loading ? <p style={{ padding: 24, textAlign: 'center' }}>Loading...</p> : dueSoon.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
              <p>No medications due in the near future.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 0 16px 0' }}>
              {dueSoon.map(m => (
                <div key={m.id} style={{ padding: 16, background: '#fefce8', borderRadius: 8, border: '1px solid #fef08a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong style={{ color: '#a16207', fontSize: '1.1rem' }}>{m.medication_name}</strong>
                    <span style={{ color: '#ca8a04', fontWeight: 600 }}>
                      {new Date(m.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ color: '#a16207', fontSize: '0.9rem' }}>
                    <strong>{m.patient_name}</strong> — Room {m.room_number || 'N/A'}
                  </div>
                  <div style={{ color: '#a16207', fontSize: '0.85rem', marginTop: 4 }}>
                    Dosage: {m.dosage}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// Quick fallback for CheckCircle
import { CheckCircle } from 'lucide-react';
