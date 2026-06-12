import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function MedicationSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

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

  async function handleConfirm(id) {
    if (!window.confirm("Did you take this medication just now?")) return;
    try {
      await api.post(`/schedules/${id}/confirm`);
      fetchData(); // refresh
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm.');
    }
  }

  async function handleUnconfirm(id) {
    if (!window.confirm("Are you sure you want to cancel the confirmation?")) return;
    try {
      await api.post(`/schedules/${id}/unconfirm`);
      fetchData(); // refresh
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel confirmation.');
    }
  }

  // Today's boundaries
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysSchedules = schedules.filter(s => {
    const d = new Date(s.scheduled_time);
    return d >= today && d < tomorrow;
  });

  return (
    <div className="id-card" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="id-section-header">
        <h3><Calendar size={20} /> Daily Medication Schedule</h3>
      </div>
      
      <div style={{ padding: 24 }}>
        <p style={{ color: '#64748b', marginBottom: 24 }}>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        {loading ? (
          <p style={{ color: '#64748b' }}>Loading schedule...</p>
        ) : todaysSchedules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, border: '2px dashed #e2e8f0', borderRadius: 8 }}>
            <p style={{ color: '#64748b', margin: 0 }}>You have no medications scheduled for today.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {todaysSchedules.map(s => {
              const isCompleted = s.status === 'completed';
              const isMissed = s.status === 'missed';
              const isPending = s.status === 'pending';
              const isOverdue = isPending && new Date(s.scheduled_time) < new Date();

              return (
                <div key={s.id} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 12,
                  border: isCompleted ? '1px solid #a7f3d0' : isMissed ? '1px solid #fecaca' : isOverdue ? '1px solid #fde68a' : '1px solid #e2e8f0',
                  background: isCompleted ? '#ecfdf5' : isMissed ? '#fef2f2' : isOverdue ? '#fffbeb' : '#f8fafc'
                }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ 
                      width: 50, height: 50, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isCompleted ? '#10b981' : isMissed ? '#ef4444' : isOverdue ? '#f59e0b' : '#cbd5e1', color: 'white', fontWeight: 700
                    }}>
                      {new Date(s.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: '#0f172a' }}>{s.prescriptionItem?.medication_name}</h4>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>{s.prescriptionItem?.dosage} {s.prescriptionItem?.dosage_unit} — {s.prescriptionItem?.route?.replace('_', ' ')}</p>
                      {isOverdue && <span style={{ color: '#d97706', fontSize: '0.85rem', fontWeight: 600 }}>Overdue</span>}
                    </div>
                  </div>

                  <div>
                    {isCompleted ? (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginBottom: 4 }}>
                          <CheckCircle size={18} /> Taken
                        </div>
                        <button onClick={() => handleUnconfirm(s.id)} style={{ background: 'none', border: 'none', color: '#64748b', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.85rem' }}>
                          Cancel confirmation
                        </button>
                      </div>
                    ) : isMissed ? (
                      <div style={{ color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <XCircle size={18} /> Missed
                      </div>
                    ) : (
                      <button className="btn-primary" onClick={() => handleConfirm(s.id)} style={{ background: '#10b981' }}>
                        <CheckCircle size={18} style={{ marginRight: 6 }}/> Confirm Taken
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
