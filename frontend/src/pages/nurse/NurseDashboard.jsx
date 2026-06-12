import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Pill, AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function NurseDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/overview'),
      api.get('/admissions', { params: { status: 'admitted' } }),
      api.get('/dashboard/medication-status'),
    ]).then(([ovRes, admRes, medRes]) => {
      setStats(ovRes.data.data);
      setPatients(admRes.data.data || []);
      setSchedules(medRes.data.data || []);
    }).catch(console.error);
  }, []);

  // Filter patients (Nurse might see all admitted patients for their ward, but we'll show all for now)
  const myPatients = patients;

  const statCards = [
    { label: 'Assigned Patients', value: myPatients.length, icon: <Users size={22} />, bg: '#fff7ed', color: '#ea580c' },
    { label: 'Upcoming Meds', value: stats?.active_prescriptions || 0, icon: <Clock size={22} />, bg: '#f0fdf4', color: '#22c55e' },
    { label: 'Missed Doses', value: stats?.overdue_count || 0, icon: <AlertTriangle size={22} />, bg: '#fef2f2', color: '#ef4444' },
    { label: 'Completed Meds', value: stats?.completed_count || 0, icon: <Pill size={22} />, bg: '#f0f9ff', color: '#0ea5e9' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Welcome, {user?.first_name}
        </h2>
        <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Here's your nursing overview for today.</p>
      </div>

      <div className="nurse-stat-grid">
        {statCards.map(c => (
          <div className="nurse-stat-card" key={c.label}>
            <div className="nurse-stat-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
            <div className="nurse-stat-content">
              <h3>{c.value}</h3>
              <p>{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Assigned Patients */}
        <div className="id-card" style={{ gridColumn: '1 / 3' }}>
          <div className="id-section-header">
            <h3>Assigned Patients</h3>
          </div>
          {myPatients.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: 24 }}>No assigned patients currently.</p>
          ) : (
            <div className="id-table-container">
              <table className="id-table">
                <thead><tr><th>Patient</th><th>Room</th><th>Admission Date</th><th>Attending Doctor</th></tr></thead>
                <tbody>
                  {myPatients.slice(0, 5).map(a => (
                    <tr key={a.id}>
                      <td><strong>{a.patient?.first_name} {a.patient?.last_name}</strong></td>
                      <td>{a.room?.room_number || 'N/A'}</td>
                      <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(a.admission_date).toLocaleDateString()}</td>
                      <td>{a.attending_doctor ? `Dr. ${a.attending_doctor.last_name}` : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upcoming Medications */}
        <div className="id-card">
          <div className="id-section-header">
            <h3><Clock size={18} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />Upcoming Medications</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {schedules.flatMap(p => p.schedules.filter(s => s.status === 'pending').map(s => ({ ...s, patient_name: p.patient_name, room: p.room_number })))
              .slice(0, 5).map(s => (
              <div key={s.id} style={{ padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong>{s.medication_name} ({s.dosage})</strong>
                  <span className="badge pending">Due Soon</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {s.patient_name} — Room {s.room || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Missed Medications */}
        <div className="id-card">
          <div className="id-section-header" style={{ borderBottom: '1px solid #fecaca' }}>
            <h3 style={{ color: '#ef4444' }}><AlertTriangle size={18} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />Missed Medications</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {schedules.flatMap(p => p.schedules.filter(s => s.status === 'missed').map(s => ({ ...s, patient_name: p.patient_name, room: p.room_number })))
              .slice(0, 5).map(s => (
              <div key={s.id} style={{ padding: 16, background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong style={{ color: '#991b1b' }}>{s.medication_name} ({s.dosage})</strong>
                  <span className="badge inactive">Missed</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#991b1b' }}>
                  {s.patient_name} — Room {s.room || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
