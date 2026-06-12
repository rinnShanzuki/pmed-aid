import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Pill, Search, CalendarClock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function MedicationPlans() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/prescriptions', { params: { status: 'active' } }),
      api.get('/dashboard/medication-status')
    ]).then(([rxRes, schedRes]) => {
      setPrescriptions(rxRes.data.data?.filter(rx => String(rx.doctor_id) === String(user?.id)) || []);
      setSchedules(schedRes.data.data || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = prescriptions.filter(rx => {
    if (!search) return true;
    const name = `${rx.patient?.first_name} ${rx.patient?.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="id-card">
      <div className="doc-section-header">
        <h3><Pill size={18} /> Medication Plans</h3>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input placeholder="Search patient..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '10px 12px 10px 36px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', width: 220 }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: 32 }}>Loading plans...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No active medication plans found.</p>
        ) : filtered.map(rx => {
          // Find if there are schedules for this patient
          const patientSched = schedules.find(s => s.patient_id === rx.patient_id);
          
          return (
            <div key={rx.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{rx.patient?.first_name} {rx.patient?.last_name}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Plan initiated: {new Date(rx.created_at || rx.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`badge ${rx.status === 'active' ? 'active' : 'inactive'}`}>{rx.status}</span>
              </div>
              
              <div style={{ display: 'grid', gap: 12 }}>
                {rx.items?.map((it, idx) => (
                  <div key={idx} style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.95rem' }}>{it.medication_name}</strong>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {it.dosage} {it.dosage_unit} • {it.frequency}x {it.frequency_unit} • For {it.duration} {it.duration_unit} ({it.route})
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {patientSched && patientSched.schedules.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                  <h5 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 6, color: '#475569' }}>
                    <CalendarClock size={16} /> Upcoming Schedule Today
                  </h5>
                  <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                    {patientSched.schedules.filter(s => s.status === 'pending').map(s => (
                      <div key={s.id} style={{ minWidth: 200, background: 'white', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <strong style={{ display: 'block', fontSize: '0.85rem' }}>{s.medication_name}</strong>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.8rem' }}>
                          <span style={{ color: '#0f172a', fontWeight: 600 }}>{new Date(s.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="badge pending">Pending</span>
                        </div>
                      </div>
                    ))}
                    {patientSched.schedules.filter(s => s.status === 'pending').length === 0 && (
                      <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>All clear for today.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
