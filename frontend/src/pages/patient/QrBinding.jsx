import { useState, useEffect } from 'react';
import api from '../../services/api';
import { ScanLine, User, Link as LinkIcon } from 'lucide-react';

export default function QrBinding() {
  const [patient, setPatient] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQr() {
      try {
        const meRes = await api.get('/patients/me');
        setPatient(meRes.data.data);
        const pId = meRes.data.data.id;
        
        // Fetch patient's active QR codes
        const qrRes = await api.get(`/qr-codes/patient/${pId}`);
        if (qrRes.data.data && qrRes.data.data.length > 0) {
          // Find active one
          const activeQr = qrRes.data.data.find(q => q.is_active);
          if (activeQr) {
            // Need to generate image since GET might not return the base64 image, only the record.
            // Wait, we didn't make a dedicated endpoint to fetch the image. 
            // The record has `code`. The info-desk generates it. 
            // We can just use an online QR API for display if we don't have the base64.
            setQrCode(activeQr.code);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchQr();
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gap: 24, gridTemplateColumns: '1fr 1fr' }}>
      
      {/* My QR Code */}
      <div className="id-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: '#0f172a' }}><ScanLine style={{ verticalAlign: 'middle', marginRight: 8 }}/> My Patient QR</h3>
        <p style={{ color: '#64748b', marginBottom: 32 }}>Show this code to nurses during medication rounds.</p>
        
        {loading ? (
          <p>Loading...</p>
        ) : qrCode ? (
          <div>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrCode}`} alt="Patient QR Code" style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, background: 'white' }} />
            <p style={{ marginTop: 16, fontSize: '0.85rem', color: '#64748b', fontFamily: 'monospace' }}>Code: {qrCode}</p>
          </div>
        ) : (
          <div style={{ padding: 40, background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
            <p style={{ color: '#64748b' }}>No active QR code linked.<br/>Please visit the Info Desk.</p>
          </div>
        )}
      </div>

      {/* Linked Account Info */}
      <div className="id-card">
        <div className="id-section-header">
          <h3><User size={18} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} /> Linked Account</h3>
        </div>
        <div style={{ padding: 24 }}>
          {patient ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="patient-avatar" style={{ width: 60, height: 60, fontSize: '1.5rem' }}>
                  {patient.first_name[0]}{patient.last_name[0]}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{patient.first_name} {patient.last_name}</h4>
                  <p style={{ margin: 0, color: '#10b981', fontWeight: 600 }}>Active Patient</p>
                </div>
              </div>
              
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#64748b' }}>Date of Birth</span>
                  <span style={{ fontWeight: 500 }}>{new Date(patient.date_of_birth).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#64748b' }}>Gender</span>
                  <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{patient.gender}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Contact</span>
                  <span style={{ fontWeight: 500 }}>{patient.phone}</span>
                </div>
              </div>
            </div>
          ) : (
             <p>Loading profile...</p>
          )}

          <div style={{ marginTop: 32 }}>
            <h4 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: 12 }}>Link New Prescription</h4>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" className="form-input" placeholder="Enter prescription linking code..." />
              <button className="btn-primary" style={{ background: '#10b981' }} onClick={() => alert("This simulates linking an external prescription.")}>
                <LinkIcon size={18} /> Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
