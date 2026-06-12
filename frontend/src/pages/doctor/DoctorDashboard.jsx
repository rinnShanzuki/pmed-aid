import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Users, BedDouble, Pill, AlertTriangle, ClipboardList, Clock } from 'lucide-react';

export default function DoctorDashboard() {
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

  const myPatients = patients.filter(a => String(a.attending_doctor_id) === String(user?.id));

  const statCards = [
    { label: "Today's Patients", value: myPatients.length, icon: <Users size={22} />, bg: '#eff6ff', color: '#3b82f6' },
    { label: 'Active Admissions', value: stats?.active_admissions || 0, icon: <BedDouble size={22} />, bg: '#f0fdf4', color: '#22c55e' },
    { label: 'Active Prescriptions', value: stats?.active_prescriptions || 0, icon: <Pill size={22} />, bg: '#fdf4ff', color: '#a855f7' },
    { label: 'Overdue Medications', value: stats?.overdue_count || 0, icon: <AlertTriangle size={22} />, bg: '#fff7ed', color: '#f97316' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
          Welcome, Dr. {user?.last_name}
        </h2>
        <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Here's your overview for today.</p>
      </div>

      <div className="doc-stat-grid">
        {statCards.map(c => (
          <div className="doc-stat-card" key={c.label}>
            <div className="doc-stat-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
            <div className="doc-stat-content">
              <h3>{c.value}</h3>
              <p>{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* My Patients Today */}
      <div className="id-card">
        <div className="doc-section-header">
          <h3><ClipboardList size={18} /> My Patients Today</h3>
        </div>
        {myPatients.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: 24 }}>No patients assigned to you today.</p>
        ) : (
          <div className="id-table-container">
            <table className="id-table">
              <thead><tr><th>Patient</th><th>Room</th><th>Admitted</th><th>Status</th></tr></thead>
              <tbody>
                {myPatients.slice(0, 10).map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.patient?.first_name} {a.patient?.last_name}</strong></td>
                    <td>{a.room?.room_number || 'N/A'}</td>
                    <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(a.admission_date).toLocaleDateString()}</td>
                    <td><span className="badge active">{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Medication Schedule */}
      <div className="id-card">
        <div className="doc-section-header">
          <h3><Clock size={18} /> Today's Medication Schedule</h3>
        </div>
        {schedules.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: 24 }}>No medication schedules today.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {schedules.slice(0, 5).map(p => (
              <div key={p.patient_id} style={{ padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong>{p.patient_name}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Room {p.room_number}</span>
                </div>
                {p.schedules.slice(0, 3).map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: '0.85rem' }}>
                    <span>{s.medication_name} — {s.dosage}</span>
                    <span className={`badge ${s.status === 'completed' ? 'active' : s.status === 'missed' ? 'inactive' : 'pending'}`}>{s.status}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
