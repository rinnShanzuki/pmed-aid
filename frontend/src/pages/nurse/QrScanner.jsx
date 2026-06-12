import { useState } from 'react';
import api from '../../services/api';
import { Scan, CheckCircle, AlertCircle, Pill } from 'lucide-react';

export default function QrScanner() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { patient, schedules }
  const [error, setError] = useState('');

  async function handleScan(e) {
    e?.preventDefault();
    if (!code.trim()) return;
    try {
      setLoading(true);
      setError('');
      setResult(null);
      const { data } = await api.post('/qr-codes/scan', { code });
      
      // We got the patient, now fetch their pending schedules for today
      const schedRes = await api.get('/schedules/patient/' + data.data.patient.id, { params: { status: 'pending' } });
      
      setResult({ patient: data.data.patient, schedules: schedRes.data.data });
      setCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or unassigned QR code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminister(id) {
    try {
      await api.post(`/schedules/${id}/administer`, { notes: 'Administered via QR scan' });
      // Update local state
      setResult(prev => ({
        ...prev,
        schedules: prev.schedules.filter(s => s.id !== id)
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to administer dose.');
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="id-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ width: 80, height: 80, background: '#fff7ed', color: '#ea580c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Scan size={40} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px' }}>Scan Patient Wristband</h2>
        <p style={{ color: '#64748b', marginBottom: 32 }}>Use the scanner to identify the patient and verify their pending medications.</p>

        <form onSubmit={handleScan} style={{ display: 'flex', gap: 12, maxWidth: 400, margin: '0 auto' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Scan or enter QR code..."
            value={code}
            onChange={e => setCode(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <button type="submit" className="btn-primary" disabled={loading} style={{ background: '#ea580c' }}>
            {loading ? 'Scanning...' : 'Scan'}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: 24, padding: 16, background: '#fef2f2', color: '#dc2626', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <AlertCircle size={20} /> {error}
          </div>
        )}
      </div>

      {result && (
        <div className="id-card" style={{ marginTop: 24 }}>
          <div className="id-section-header" style={{ borderBottom: '1px solid #e2e8f0' }}>
            <h3><CheckCircle size={20} color="#10b981" /> Patient Verified: {result.patient.first_name} {result.patient.last_name}</h3>
          </div>
          
          <div style={{ padding: 24 }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}><Pill size={18} /> Pending Medications</h4>
            
            {result.schedules.length === 0 ? (
              <p style={{ color: '#64748b', margin: 0 }}>No pending medications for this patient.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {result.schedules.map(s => (
                  <div key={s.id} style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '1.1rem' }}>{s.prescriptionItem?.medication_name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>
                        {s.prescriptionItem?.dosage} {s.prescriptionItem?.dosage_unit} — {s.prescriptionItem?.route?.replace('_', ' ')}
                      </div>
                      <div style={{ color: '#ea580c', fontSize: '0.85rem', marginTop: 4, fontWeight: 500 }}>
                        Scheduled for: {new Date(s.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button className="btn-primary" onClick={() => handleAdminister(s.id)} style={{ background: '#10b981' }}>
                      Mark Administered
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
