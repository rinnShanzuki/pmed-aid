import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileText, Pill, Calendar } from 'lucide-react';

export default function MyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const meRes = await api.get('/patients/me');
        const pId = meRes.data.data.id;
        
        const presRes = await api.get('/prescriptions', { params: { patient_id: pId } });
        setPrescriptions(presRes.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const active = prescriptions.filter(p => p.status === 'active');
  const past = prescriptions.filter(p => p.status !== 'active');

  return (
    <div className="id-card">
      <div className="id-section-header">
        <h3><FileText size={20} /> My Prescriptions</h3>
      </div>

      <div style={{ padding: 24 }}>
        {loading ? (
          <p style={{ color: '#64748b' }}>Loading your prescriptions...</p>
        ) : (
          <>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#0f172a' }}>Current Prescriptions</h4>
            {active.length === 0 ? (
              <p style={{ color: '#64748b', marginBottom: 32 }}>You have no active prescriptions.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
                {active.map(p => (
                  <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span className="badge active">Active</span>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}><Calendar size={12} style={{ display: 'inline', marginRight: 4 }}/> {new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ color: '#0f172a', fontWeight: 600, marginBottom: 4 }}>Prescribed by: Dr. {p.doctor?.last_name}</div>
                    {p.notes && <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 12 }}>"{p.notes}"</div>}
                    
                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6 }}>
                      <strong style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' }}>Medications:</strong>
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, fontSize: '0.9rem', color: '#334155' }}>
                        {p.items?.map(item => (
                          <li key={item.id} style={{ marginBottom: 4 }}>
                            <strong>{item.medication_name}</strong> - {item.dosage} {item.dosage_unit} 
                            <span style={{ color: '#64748b' }}> ({item.frequency})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h4 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#0f172a' }}>Past Prescriptions</h4>
            {past.length === 0 ? (
              <p style={{ color: '#64748b' }}>No past prescriptions found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {past.map(p => (
                  <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <div>
                      <div style={{ fontWeight: 500, color: '#334155' }}>Dr. {p.doctor?.last_name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{p.items?.length || 0} medications</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge inactive" style={{ marginBottom: 4, display: 'inline-block' }}>{p.status}</span>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(p.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
