import { useState, useEffect } from 'react';
import api from '../../services/api';
import { BarChart3, Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Adherence() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get all admitted patients for this doctor and their schedule status
    Promise.all([
      api.get('/admissions', { params: { status: 'admitted' } }),
      api.get('/dashboard/medication-status') // this groups by patient_id
    ]).then(([admRes, schedRes]) => {
      const myAdmissions = admRes.data.data?.filter(a => String(a.attending_doctor_id) === String(user?.id)) || [];
      const schedData = schedRes.data.data || [];
      
      const adherenceData = myAdmissions.map(adm => {
        const pSched = schedData.find(s => String(s.patient_id) === String(adm.patient_id));
        const allSchedules = pSched ? pSched.schedules : [];
        
        const total = allSchedules.length;
        const completed = allSchedules.filter(s => s.status === 'completed').length;
        const missed = allSchedules.filter(s => s.status === 'missed').length;
        const skipped = allSchedules.filter(s => s.status === 'skipped').length;
        const pending = allSchedules.filter(s => s.status === 'pending').length;
        
        // Calculate compliance based on past/current medications (ignoring pending)
        const actionable = total - pending;
        const compliance = actionable > 0 ? Math.round((completed / actionable) * 100) : 0;
        
        return {
          id: adm.patient_id,
          name: `${adm.patient?.first_name} ${adm.patient?.last_name}`,
          room: adm.room?.room_number,
          total, completed, missed, skipped, pending, actionable, compliance,
          missedList: allSchedules.filter(s => s.status === 'missed')
        };
      });
      
      setPatients(adherenceData);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  function getComplianceColor(pct, actionable) {
    if (actionable === 0) return '#cbd5e1'; // No data
    if (pct >= 90) return '#10b981'; // Green
    if (pct >= 70) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  }

  return (
    <div className="id-card">
      <div className="doc-section-header">
        <h3><BarChart3 size={18} /> Adherence Monitoring</h3>
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Today's Compliance Rates</span>
      </div>

      <div style={{ display: 'grid', gap: 20 }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: 32 }}>Loading adherence data...</p>
        ) : patients.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No active patients assigned.</p>
        ) : patients.map(p => (
          <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#0f172a' }}>{p.name}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Room {p.room || 'N/A'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: getComplianceColor(p.compliance, p.actionable) }}>
                  {p.actionable > 0 ? `${p.compliance}%` : '—'}
                </span>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Compliance</p>
              </div>
            </div>

            {/* Adherence Bar */}
            <div className="adherence-bar-bg" style={{ marginBottom: 20 }}>
              <div className="adherence-bar-fill" 
                style={{ 
                  width: p.actionable > 0 ? `${p.compliance}%` : '0%', 
                  background: getComplianceColor(p.compliance, p.actionable) 
                }} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, background: '#f8fafc', padding: 16, borderRadius: 8 }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Completed</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>{p.completed}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Missed</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444' }}>{p.missed}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Skipped</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>{p.skipped}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Pending</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3b82f6' }}>{p.pending}</span>
              </div>
            </div>

            {p.missedList.length > 0 && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
                <h5 style={{ margin: '0 0 8px 0', color: '#991b1b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={16} /> Missed Medications Today
                </h5>
                <ul style={{ margin: 0, paddingLeft: 20, color: '#b91c1c', fontSize: '0.85rem' }}>
                  {p.missedList.map(m => (
                    <li key={m.id}>{m.medication_name} — scheduled for {new Date(m.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
