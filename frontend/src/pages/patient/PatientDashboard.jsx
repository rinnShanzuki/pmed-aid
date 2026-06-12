import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Pill, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [patientId, setPatientId] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Get Patient Profile
        const meRes = await api.get('/patients/me');
        const pId = meRes.data.data.id;
        setPatientId(pId);

        // Get Schedules for today
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

  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Filter schedules for strictly today
  const todaysSchedules = schedules.filter(s => {
    const d = new Date(s.scheduled_time);
    return d >= today && d < tomorrow;
  });

  const completed = todaysSchedules.filter(s => s.status === 'completed');
  const missed = todaysSchedules.filter(s => s.status === 'missed');
  const pending = todaysSchedules.filter(s => s.status === 'pending');
  
  const upcoming = pending.filter(s => new Date(s.scheduled_time) >= now).sort((a,b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));

  const adherence = todaysSchedules.length > 0 
    ? Math.round((completed.length / (completed.length + missed.length + pending.length)) * 100) 
    : 100;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Hello, {user?.first_name}
        </h2>
        <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Here is your daily health snapshot.</p>
      </div>

      <div className="patient-stat-grid">
        <div className="patient-stat-card">
          <div className="patient-stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}><Pill size={22} /></div>
          <div className="patient-stat-content">
            <h3>{todaysSchedules.length}</h3>
            <p>Total Meds Today</p>
          </div>
        </div>
        <div className="patient-stat-card">
          <div className="patient-stat-icon" style={{ background: '#f0f9ff', color: '#0ea5e9' }}><CheckCircle size={22} /></div>
          <div className="patient-stat-content">
            <h3>{completed.length}</h3>
            <p>Doses Taken</p>
          </div>
        </div>
        <div className="patient-stat-card">
          <div className="patient-stat-icon" style={{ background: '#fff7ed', color: '#ea580c' }}><Clock size={22} /></div>
          <div className="patient-stat-content">
            <h3>{adherence}%</h3>
            <p>Daily Adherence</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Today's Progress */}
        <div className="id-card">
          <div className="id-section-header">
            <h3>Adherence Progress</h3>
          </div>
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ width: 150, height: 150, borderRadius: '50%', background: `conic-gradient(#10b981 ${adherence}%, #f1f5f9 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <span style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{adherence}%</span>
              </div>
            </div>
            <p style={{ color: '#64748b' }}>
              You have taken {completed.length} out of {todaysSchedules.length} medications today.
            </p>
          </div>
        </div>

        {/* Upcoming Reminders */}
        <div className="id-card">
          <div className="id-section-header">
            <h3><Bell size={18} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} /> Upcoming Reminders</h3>
          </div>
          <div style={{ padding: 24 }}>
            {upcoming.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>
                <CheckCircle size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                <p>No more medications scheduled for today.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcoming.map((s, i) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: i === 0 ? '#ecfdf5' : '#f8fafc', border: `1px solid ${i === 0 ? '#a7f3d0' : '#e2e8f0'}`, borderRadius: 8 }}>
                    <div style={{ background: i === 0 ? '#10b981' : '#cbd5e1', color: 'white', padding: '8px 12px', borderRadius: 8, fontWeight: 700 }}>
                      {new Date(s.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: '#0f172a', display: 'block', fontSize: '1.1rem' }}>{s.prescriptionItem?.medication_name}</strong>
                      <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{s.prescriptionItem?.dosage} {s.prescriptionItem?.dosage_unit}</span>
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

// Fallback
import { Bell } from 'lucide-react';
