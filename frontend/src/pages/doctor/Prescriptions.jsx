import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Search, FileSignature, Eye, ArrowLeft, Pill } from 'lucide-react';

export default function Prescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'view' or null
  const [viewData, setViewData] = useState(null);

  async function fetchPrescriptions() {
    try {
      const { data } = await api.get('/prescriptions');
      setPrescriptions(data.data?.filter(rx => String(rx.doctor_id) === String(user?.id)) || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchPrescriptions(); }, []);

  async function openView(id) {
    try {
      const { data } = await api.get(`/prescriptions/${id}`);
      setViewData(data.data); setModal('view');
    } catch (err) { console.error(err); }
  }

  const filtered = prescriptions.filter(rx => {
    if (!search) return true;
    const name = `${rx.patient?.first_name} ${rx.patient?.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  if (modal === 'view' && viewData) {
    return (
      <div style={{ padding: '0 0 40px 0' }}>
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}>
            <ArrowLeft size={16} /> Back to Prescriptions
          </button>
        </div>
        
        <div style={{ background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ background: '#eff6ff', color: '#3b82f6', width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSignature size={28} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>Prescription #{viewData.id}</h2>
                <div style={{ fontSize: '0.95rem', color: '#64748b', marginTop: 4 }}>
                  Patient: <strong style={{ color: '#0f172a' }}>{viewData.patient?.first_name} {viewData.patient?.last_name}</strong> • Date: {new Date(viewData.created_at || viewData.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 32 }}>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <label style={lbl}>Type</label>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b', fontWeight: 500, textTransform: 'capitalize' }}>{viewData.type?.replace('_', ' ')}</p>
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <label style={lbl}>Status</label>
              <div style={{ marginTop: 4 }}><span className={`badge ${viewData.status}`}>{viewData.status}</span></div>
            </div>
            {viewData.notes && (
              <div style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <label style={lbl}>Notes / Clinical Impression</label>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b', lineHeight: '1.6' }}>{viewData.notes}</p>
              </div>
            )}
          </div>

          <div>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '2px solid #f1f5f9', paddingBottom: 8 }}>
              <Pill size={18} /> Medication Items
            </h3>
            {viewData.items?.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No medication items.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {viewData.items?.map((it, i) => (
                  <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <strong style={{ color: '#334155', fontSize: '0.95rem' }}>{it.medication_name}</strong>
                    </div>
                    <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
                      <div><span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: 4 }}>Dosage</span><strong style={{ color: '#0f172a' }}>{it.dosage} {it.dosage_unit}</strong></div>
                      <div><span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: 4 }}>Frequency</span><strong style={{ color: '#0f172a' }}>{it.frequency}x / {it.frequency_unit}</strong></div>
                      <div><span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: 4 }}>Schedule</span><strong style={{ color: '#0f172a' }}>{it.start_time ? `${it.start_time.slice(0, 5)}` : 'Auto'} {it.interval_hours ? ` (q${it.interval_hours}h)` : ''}</strong></div>
                      <div><span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: 4 }}>Duration</span><strong style={{ color: '#0f172a' }}>{it.duration} {it.duration_unit}</strong></div>
                      <div><span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: 4 }}>Route</span><strong style={{ color: '#0f172a' }}>{it.route}</strong></div>
                      {it.instructions && <div style={{ gridColumn: '1 / -1', marginTop: 8, paddingTop: 8, borderTop: '1px dashed #e2e8f0' }}><span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: 4 }}>Instructions</span><span style={{ color: '#334155', fontStyle: 'italic' }}>{it.instructions}</span></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="id-card">
        <div className="doc-section-header">
          <h3><FileSignature size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Prescription Management</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ padding: '10px 12px 10px 36px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', width: 200 }} />
            </div>
          </div>
        </div>

        <div className="id-table-container">
          <table className="id-table">
            <thead><tr><th>Patient</th><th>Type</th><th>Items</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32 }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No prescriptions found</td></tr>
              ) : filtered.map(rx => (
                <tr key={rx.id}>
                  <td><strong>{rx.patient?.first_name} {rx.patient?.last_name}</strong></td>
                  <td><span className={`badge ${rx.type === 'discharge' ? 'discharged' : 'active'}`}>{rx.type?.replace('_', ' ')}</span></td>
                  <td>{rx.items?.length || 0} items</td>
                  <td><span className={`badge ${rx.status}`}>{rx.status}</span></td>
                  <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {new Date(rx.created_at || rx.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="action-btn outline" onClick={() => openView(rx.id)} title="View"><Eye size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const lbl = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 4 };
