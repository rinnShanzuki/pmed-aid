import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Activity, AlertTriangle, CheckCircle2, Clock, Home } from 'lucide-react';

export default function PatientMonitoring() {
  const [wardRows, setWardRows] = useState([]);
  const [takeHome, setTakeHome] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
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
  const overdue = wardDoses.filter(d => d.status === 'pending' && new Date(d.scheduled_time) < new Date());
  const pending = wardDoses.filter(d => d.status === 'pending' && new Date(d.scheduled_time) >= new Date());
  const completed = wardDoses.filter(d => d.status === 'completed');

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Patient Monitoring</h2>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Track in-hospital medication delivery and take-home adherence readiness.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Metric label="Overdue ward doses" value={overdue.length} icon={<AlertTriangle size={22} />} color="#dc2626" bg="#fef2f2" />
        <Metric label="Pending ward doses" value={pending.length} icon={<Clock size={22} />} color="#ca8a04" bg="#fefce8" />
        <Metric label="Completed today" value={completed.length} icon={<CheckCircle2 size={22} />} color="#16a34a" bg="#f0fdf4" />
        <Metric label="Take-home prescriptions" value={takeHome.length} icon={<Home size={22} />} color="#2563eb" bg="#eff6ff" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(320px, 0.7fr)', gap: 24 }}>
        <div className="id-card">
          <div className="id-section-header">
            <h3><Activity size={20} /> Ward Medication Status</h3>
          </div>
          <div className="id-table-container">
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Loading monitoring data...</div>
            ) : wardDoses.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>No ward medication schedules found for today.</div>
            ) : (
              <table className="id-table">
                <thead>
                  <tr><th>Patient</th><th>Room</th><th>Medication</th><th>Time</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {wardDoses.map(dose => (
                    <tr key={dose.id}>
                      <td><strong>{dose.patient_name}</strong></td>
                      <td>{dose.room_number || 'N/A'}</td>
                      <td>{dose.medication_name}<div style={{ fontSize: '0.8rem', color: '#64748b' }}>{dose.dosage}</div></td>
                      <td>{new Date(dose.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td><span className={`badge ${dose.status === 'completed' ? 'active' : dose.status === 'pending' ? 'pending' : 'inactive'}`}>{dose.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="id-card">
          <div className="id-section-header">
            <h3><Home size={20} /> Take-home Prescriptions</h3>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              <p style={{ color: '#64748b' }}>Loading...</p>
            ) : takeHome.length === 0 ? (
              <p style={{ color: '#64748b', margin: 0 }}>No active take-home prescriptions.</p>
            ) : takeHome.map(rx => (
              <div key={rx.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                <strong>{rx.patient?.first_name} {rx.patient?.last_name}</strong>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>{rx.items?.length || 0} medication item(s)</div>
                <button className="action-btn outline" style={{ marginTop: 10 }} onClick={() => window.location.href = `/info-desk/prescriptions?prescription_id=${rx.id}`}>
                  Open prescription
                </button>
              </div>
            ))}
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
