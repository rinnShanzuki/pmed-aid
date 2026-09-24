import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Scan, CheckCircle, AlertCircle, Pill, Camera } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QrScanner() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { patient, schedules }
  const [error, setError] = useState('');

  async function processQrCode(qrString) {
    if (!qrString || !qrString.trim()) return;
    try {
      setLoading(true);
      setError('');
      setResult(null);
      const { data } = await api.post('/qr-codes/scan', { code: qrString.trim() });

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

  useEffect(() => {
    let scanner = null;
    let isProcessing = false;

    const timer = setTimeout(() => {
      const el = document.getElementById("qr-reader");
      if (!el) return;

      scanner = new Html5QrcodeScanner("qr-reader", {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      }, false);

      scanner.render(
        async (decodedText) => {
          if (isProcessing) return;
          isProcessing = true;
          await processQrCode(decodedText);
          setTimeout(() => { isProcessing = false; }, 2500);
        },
        (err) => {
          // ignore frame scan errors
        }
      );
    }, 150);

    return () => {
      clearTimeout(timer);
      if (scanner) {
        scanner.clear().catch(() => { });
      }
    };
  }, []);

  async function handleManualScan(e) {
    e?.preventDefault();
    await processQrCode(code);
  }

  async function handleAdminister(id) {
    try {
      await api.post(`/schedules/${id}/administer`, { notes: 'Administered via QR scan' });
      setResult(prev => ({
        ...prev,
        schedules: prev.schedules.filter(s => s.id !== id)
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to administer dose.');
    }
  }

  return (
    <div style={{ maxWidth: 850, margin: '0 auto', padding: '24px 16px' }}>
      {/* Custom Styles to Override html5-qrcode's ugly defaults */}
      <style>{`
        #qr-reader {
          border: none !important;
          border-radius: 16px;
          overflow: hidden;
        }
        #qr-reader__dashboard_section_csr span {
          display: flex !important;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }
        #qr-reader button {
          background-color: #3b82f6 !important;
          color: white !important;
          border: none !important;
          padding: 10px 24px !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3) !important;
        }
        #qr-reader button:hover {
          background-color: #2563eb !important;
          transform: translateY(-1px);
          box-shadow: 0 6px 8px -1px rgba(59, 130, 246, 0.4) !important;
        }
        #qr-reader select {
          padding: 10px 16px !important;
          border-radius: 8px !important;
          border: 1px solid #cbd5e1 !important;
          outline: none !important;
          font-family: inherit !important;
          color: #334155 !important;
          background-color: white !important;
          cursor: pointer !important;
        }
        #qr-reader img {
          display: none !important; /* Hide default scan image icon */
        }
        #qr-reader__dashboard_section_swaplink {
          color: #3b82f6 !important;
          text-decoration: none !important;
          font-weight: 500 !important;
          margin-top: 12px !important;
          display: inline-block;
        }
        #qr-reader__dashboard_section_swaplink:hover {
          color: #2563eb !important;
          text-decoration: underline !important;
        }
        .pulse-icon {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(14, 165, 233, 0); }
          100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
        }
        .input-group {
          display: flex;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 9999px;
          overflow: hidden;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .input-group:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }
        .input-group input {
          border: none;
          background: transparent;
          padding: 14px 24px;
          flex: 1;
          outline: none;
          font-size: 1rem;
          color: #0f172a;
        }
        .input-group button {
          border: none;
          background: #3b82f6;
          color: white;
          font-weight: 600;
          padding: 0 32px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .input-group button:hover:not(:disabled) {
          background: #2563eb;
        }
        .input-group button:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }
      `}</style>

      <div className="id-card" style={{ textAlign: 'center', padding: '48px 32px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)' }}>

        {/* Header Section */}
        <div style={{ marginBottom: 32 }}>
          <div className="pulse-icon" style={{ width: 88, height: 88, background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', color: '#0284c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Camera size={44} strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px', letterSpacing: '-0.5px' }}>Scan Patient Wristband</h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: 450, margin: '0 auto' }}>
            Point your device camera at the patient's wristband QR code to securely verify and view pending medications.
          </p>
        </div>

        {/* Camera Scanner Box */}
        <div style={{
          maxWidth: 500,
          margin: '0 auto 32px',
          borderRadius: 20,
          background: '#ffffff',
          padding: 8,
          boxShadow: '0 0 0 1px rgba(226, 232, 240, 1), 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#3b82f6', color: 'white', padding: '4px 16px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', boxShadow: '0 2px 4px rgba(59,130,246,0.3)', zIndex: 10 }}>
            Scanner
          </div>
          <div id="qr-reader" style={{ width: '100%', background: '#f8fafc', borderRadius: 16 }}></div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '32px auto', maxWidth: 450, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px' }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(226,232,240,0) 0%, rgba(226,232,240,1) 100%)' }}></div>
          <span style={{ padding: '0 16px' }}>OR MANUAL INPUT</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(226,232,240,1) 0%, rgba(226,232,240,0) 100%)' }}></div>
        </div>

        {/* Manual Input Form */}
        <form onSubmit={handleManualScan} style={{ maxWidth: 450, margin: '0 auto' }}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter wristband code..."
              value={code}
              onChange={e => setCode(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !code.trim()}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>

        {error && (
          <div style={{ maxWidth: 450, margin: '24px auto 0', padding: '16px 20px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left', boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.1)' }}>
            <AlertCircle size={24} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ display: 'block', marginBottom: 4 }}>Verification Failed</strong>
              <span style={{ fontSize: '0.95rem' }}>{error}</span>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div style={{ animation: 'slideUp 0.4s ease-out forwards' }}>
          <style>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <div className="id-card" style={{ border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', overflow: 'hidden', padding: 0 }}>

            <div style={{ background: '#f0fdf4', padding: '24px 32px', borderBottom: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, background: '#10b981', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }}>
                <CheckCircle size={28} />
              </div>
              <div>
                <div style={{ color: '#166534', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Patient Verified</div>
                <h3 style={{ margin: 0, color: '#14532d', fontSize: '1.5rem', fontWeight: 800 }}>{result.patient.first_name} {result.patient.last_name}</h3>
              </div>
            </div>

            <div style={{ padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ padding: 8, background: '#f1f5f9', borderRadius: 8, color: '#475569' }}>
                  <Pill size={20} />
                </div>
                <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: 700 }}>Pending Medications</h4>
              </div>

              {result.schedules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e2e8f0' }}>
                  <div style={{ width: 64, height: 64, background: '#f1f5f9', color: '#94a3b8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <CheckCircle size={32} />
                  </div>
                  <h5 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: '#334155' }}>All Clear!</h5>
                  <p style={{ color: '#64748b', margin: 0 }}>There are no pending medications for this patient at the moment.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                  {result.schedules.map(s => (
                    <div key={s.id} style={{
                      padding: 20,
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: 16,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s ease'
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                      }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.15rem' }}>{s.prescriptionItem?.medication_name}</div>
                          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 10px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}>
                            {s.prescriptionItem?.route?.replace('_', ' ')}
                          </span>
                        </div>

                        <div style={{ color: '#475569', fontSize: '1rem', fontWeight: 500, marginBottom: 8 }}>
                          <strong style={{ color: '#334155' }}>Dosage:</strong> {s.prescriptionItem?.dosage}
                        </div>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f1f5f9', padding: '4px 12px', borderRadius: 8, color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          Scheduled: {new Date(s.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <button
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#059669';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(16, 185, 129, 0.4)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#10b981';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(16, 185, 129, 0.3)';
                        }}
                        onClick={() => handleAdminister(s.id)}
                      >
                        <CheckCircle size={18} />
                        Administer Dose
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
