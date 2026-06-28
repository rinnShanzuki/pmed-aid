import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Activity, AlertTriangle, CheckCircle2, Clock, Home } from 'lucide-react';

export default function PatientMonitoring() {
  const [wardRows, setWardRows] = useState([]);
  const [takeHome, setTakeHome] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const [wardRes, rxRes] = await Promise.all([
        api.get('/dashboard/medication-status'),
        api.get('/prescriptions', { params: { type: 'discharge', status: 'active' } }),
      ]);
      setWardRows(wardRes.data.data || []);
      setTakeHome(rxRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const wardDoses = wardRows.flatMap(row =>
    row.schedules.map(schedule => ({
      ...schedule,
      patient_name: row.patient_name,
      room_number: row.room_number,
    }))
  );
  
  const now = new Date();
  const overdue = wardDoses.filter(d => d.status === 'pending' && new Date(d.scheduled_time) < now).sort((a,b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));
  const pending = wardDoses.filter(d => d.status === 'pending' && new Date(d.scheduled_time) >= now).sort((a,b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));
  const completed = wardDoses.filter(d => d.status === 'completed').sort((a,b) => new Date(b.administered_at) - new Date(a.administered_at));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Patient Monitoring</h2>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Track in-hospital medication delivery and take-home adherence readiness.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Metric label="Overdue ward doses" value={overdue.length} icon={<AlertTriangle size={22} />} color="#dc2626" bg="#fef2f2" />
        <Metric label="Upcoming ward doses" value={pending.length} icon={<Clock size={22} />} color="#ca8a04" bg="#fefce8" />
        <Metric label="Completed today" value={completed.length} icon={<CheckCircle2 size={22} />} color="#16a34a" bg="#f0fdf4" />
        <Metric label="Take-home prescriptions" value={takeHome.length} icon={<Home size={22} />} color="#2563eb" bg="#eff6ff" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        
        {/* WARD MONITORING COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* OVERDUE */}
          <div className="id-card" style={{ borderTop: '4px solid #ef4444' }}>
            <div className="id-section-header">
              <h3 style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={20} /> Overdue Medications</h3>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loading && overdue.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center' }}>Loading...</p> : 
               overdue.length === 0 ? <p style={{ color: '#10b981', textAlign: 'center' }}>No overdue medications.</p> :
               overdue.map(dose => (
                <div key={dose.id} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#991b1b', fontSize: '1.05rem', display: 'block' }}>{dose.patient_name} <span style={{ fontSize: '0.85rem', fontWeight: 'normal' }}>(Room {dose.room_number})</span></strong>
                    <span style={{ color: '#b91c1c', fontSize: '0.9rem' }}>{dose.medication_name} — {dose.dosage} ({dose.route})</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#dc2626', fontWeight: 700, fontSize: '1.1rem' }}>{new Date(dose.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style={{ color: '#ef4444', fontSize: '0.8rem' }}>{Math.round((now - new Date(dose.scheduled_time)) / 60000)} mins overdue</div>
                  </div>
                </div>
               ))}
            </div>
          </div>

          {/* UPCOMING */}
          <div className="id-card" style={{ borderTop: '4px solid #eab308' }}>
            <div className="id-section-header">
              <h3 style={{ color: '#ca8a04', display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={20} /> Upcoming Medications</h3>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loading && pending.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center' }}>Loading...</p> : 
               pending.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center' }}>No upcoming medications today.</p> :
               pending.map(dose => (
                <div key={dose.id} style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#854d0e', fontSize: '1.05rem', display: 'block' }}>{dose.patient_name} <span style={{ fontSize: '0.85rem', fontWeight: 'normal' }}>(Room {dose.room_number})</span></strong>
                    <span style={{ color: '#a16207', fontSize: '0.9rem' }}>{dose.medication_name} — {dose.dosage}</span>
                  </div>
                  <div style={{ textAlign: 'right', color: '#854d0e', fontWeight: 700, fontSize: '1.1rem' }}>
                    {new Date(dose.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
               ))}
            </div>
          </div>

          {/* COMPLETED */}
          <div className="id-card" style={{ borderTop: '4px solid #22c55e' }}>
            <div className="id-section-header">
              <h3 style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={20} /> Completed Today</h3>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loading && completed.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center' }}>Loading...</p> : 
               completed.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center' }}>No medications completed today.</p> :
               completed.map(dose => (
                <div key={dose.id} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#166534', fontSize: '0.95rem', display: 'block' }}>{dose.patient_name}</strong>
                    <span style={{ color: '#15803d', fontSize: '0.85rem' }}>{dose.medication_name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#166534', fontWeight: 600, fontSize: '0.9rem' }}>Done at {new Date(dose.administered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style={{ color: '#15803d', fontSize: '0.8rem' }}>by {dose.administered_by}</div>
                  </div>
                </div>
               ))}
            </div>
          </div>
          
        </div>

        {/* SIDEBAR COLUMN */}
        <div>
          <div className="id-card">
            <div className="id-section-header">
              <h3 style={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}><Home size={20} /> Take-home Rx</h3>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loading && takeHome.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', padding: 24 }}>Loading...</div>
              ) : takeHome.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', padding: 24 }}>No active take-home prescriptions.</div>
              ) : takeHome.map(rx => (
                <div key={rx.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                  <strong>{rx.patient?.first_name} {rx.patient?.last_name}</strong>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>
                    {rx.items?.length || 0} medication item(s)
                  </div>
                  <button className="action-btn outline" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }} onClick={() => window.location.href = `/info-desk/prescriptions?prescription_id=${rx.id}`}>
                    Open prescription
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, icon, color, bg }) {
  return (
    <div className="id-card" style={{ margin: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
        </div>
      </div>
    </div>
  );
}
