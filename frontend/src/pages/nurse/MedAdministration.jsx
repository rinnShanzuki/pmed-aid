import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Pill, CheckCircle, Clock, XCircle, Search, QrCode } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function MedAdministration() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, completed, missed
  const [search, setSearch] = useState('');
  
  const [scanModal, setScanModal] = useState(null);
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, [filter]);

  useEffect(() => {
    if (scanModal) {
      setScanError('');
      setScanSuccess('');
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      
      let isProcessing = false;
      scanner.render(
        async (decodedText) => {
          if (isProcessing) return;
          isProcessing = true;
          
          try {
            const { data } = await api.post('/qr-codes/verify', { code: decodedText });
            if (!data.data.is_active || data.data.type !== 'in_hospital') {
              setScanError('Invalid or inactive wristband QR.');
              isProcessing = false;
              return;
            }
            if (data.data.patient_id !== scanModal.patient_id) {
              setScanError('Mismatch! This wristband belongs to a different patient.');
              isProcessing = false;
              return;
            }
            
            // Match! Administer the dose.
            setScanSuccess('Patient verified! Administering dose...');
            await scanner.clear();
            await api.post(`/schedules/${scanModal.id}/administer`, { notes: 'Administered via QR confirmation' });
            setTimeout(() => {
              setScanModal(null);
              fetchSchedules();
            }, 1500);
          } catch (err) {
            setScanError('Failed to verify QR code with server.');
            isProcessing = false;
          }
        },
        (err) => {
          // ignore scan errors
        }
      );
      return () => {
        scanner.clear().catch(() => {});
      };
    }
  }, [scanModal]);

  async function fetchSchedules() {
    try {
      setLoading(true);
      const { data } = await api.get('/schedules', { params: { status: filter } });
      setSchedules(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = schedules.filter(s => {
    if (!search) return true;
    const name = `${s.patient?.first_name} ${s.patient?.last_name}`.toLowerCase();
    const med = s.prescriptionItem?.medication_name?.toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || med?.includes(q);
  });

  return (
    <>
      <div className="id-card">
        <div className="id-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3><Pill size={20} /> Medication Administration</h3>
            <div className="search-bar" style={{ width: 250 }}>
              <Search size={16} />
              <input
                placeholder="Search patient or med..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={`btn-secondary ${filter === 'pending' ? 'active-filter' : ''}`} onClick={() => setFilter('pending')} style={filter === 'pending' ? { background: '#f8fafc', borderColor: '#cbd5e1' } : {}}>Pending</button>
            <button className={`btn-secondary ${filter === 'completed' ? 'active-filter' : ''}`} onClick={() => setFilter('completed')} style={filter === 'completed' ? { background: '#f8fafc', borderColor: '#cbd5e1' } : {}}>Completed</button>
            <button className={`btn-secondary ${filter === 'missed' ? 'active-filter' : ''}`} onClick={() => setFilter('missed')} style={filter === 'missed' ? { background: '#f8fafc', borderColor: '#cbd5e1' } : {}}>Missed</button>
          </div>
        </div>

        <div className="id-table-container">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading schedules...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No {filter} medications found.</div>
          ) : (
            <table className="id-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Medication</th>
                  <th>Route</th>
                  <th>Status</th>
                  {filter === 'pending' && <th style={{ textAlign: 'right' }}>Actions</th>}
                  {filter === 'completed' && <th>Administered By</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="#64748b" />
                        {new Date(s.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(s.scheduled_time).toLocaleDateString()}</div>
                    </td>
                    <td><strong>{s.patient?.first_name} {s.patient?.last_name}</strong></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.prescriptionItem?.medication_name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{s.prescriptionItem?.dosage} {s.prescriptionItem?.dosage_unit}</div>
                    </td>
                    <td style={{ color: '#64748b' }}>{s.prescriptionItem?.route?.replace('_', ' ')}</td>
                    <td>
                      <span className={`badge ${s.status === 'completed' ? 'active' : s.status === 'missed' ? 'inactive' : 'pending'}`}>
                        {s.status}
                      </span>
                    </td>
                    {filter === 'pending' && (
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-primary" onClick={() => setScanModal(s)} style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#0ea5e9', borderColor: '#0284c7' }}>
                          <QrCode size={14} style={{ marginRight: 4 }} /> Scan Patient ID
                        </button>
                      </td>
                    )}
                    {filter === 'completed' && (
                      <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {s.administeredBy ? `${s.administeredBy.first_name} ${s.administeredBy.last_name}` : 'Unknown'}
                        <br/>
                        {s.administered_at && new Date(s.administered_at).toLocaleTimeString()}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {scanModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setScanModal(null)}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Scan Patient Wristband</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>
                Verify identity for: <strong>{scanModal.patient?.first_name} {scanModal.patient?.last_name}</strong>
              </p>
            </div>
            
            <div style={{ padding: '24px' }}>
              {scanError && <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, marginBottom: 16, fontWeight: 500, textAlign: 'center' }}>{scanError}</div>}
              {scanSuccess && <div style={{ padding: '12px', background: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: 16, fontWeight: 500, textAlign: 'center' }}>{scanSuccess}</div>}
              
              <div id="reader" style={{ width: '100%', border: 'none', borderRadius: 8, overflow: 'hidden' }}></div>
            </div>

            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
              <button className="action-btn outline" onClick={() => setScanModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
