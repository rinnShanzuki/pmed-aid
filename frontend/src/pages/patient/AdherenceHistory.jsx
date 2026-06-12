import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Activity, CheckCircle, XCircle } from 'lucide-react';

export default function AdherenceHistory() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const meRes = await api.get('/patients/me');
        const pId = meRes.data.data.id;
        
        const schedRes = await api.get(`/schedules/patient/${pId}`);
        setSchedules(schedRes.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const history = schedules.filter(s => s.status === 'completed' || s.status === 'missed')
                           .sort((a,b) => new Date(b.scheduled_time) - new Date(a.scheduled_time));

  return (
    <div className="id-card">
      <div className="id-section-header">
        <h3><Activity size={20} /> Adherence History</h3>
      </div>
      
      <div style={{ padding: 24 }}>
        {loading ? (
          <p style={{ color: '#64748b' }}>Loading history...</p>
        ) : history.length === 0 ? (
          <p style={{ color: '#64748b' }}>No adherence history available.</p>
        ) : (
          <table className="id-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Status</th>
                <th>Administered At</th>
              </tr>
            </thead>
            <tbody>
              {history.map(s => {
                const isCompleted = s.status === 'completed';
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{new Date(s.scheduled_time).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(s.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.prescriptionItem?.medication_name}</td>
                    <td style={{ color: '#64748b' }}>{s.prescriptionItem?.dosage} {s.prescriptionItem?.dosage_unit}</td>
                    <td>
                      {isCompleted ? (
                         <span className="badge active" style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}><CheckCircle size={14}/> Completed</span>
                      ) : (
                         <span className="badge inactive" style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}><XCircle size={14}/> Missed</span>
                      )}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                      {s.administered_at ? new Date(s.administered_at).toLocaleTimeString() : '--'}
                      {s.administeredBy && <div style={{ color: '#94a3b8' }}>By {s.administeredBy.first_name} {s.administeredBy.last_name}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
