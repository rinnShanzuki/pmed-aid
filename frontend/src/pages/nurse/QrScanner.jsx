import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Scan, CheckCircle, AlertCircle, Pill, Camera, X, Clock } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QrScanner() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { patient, schedules }
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [administeringId, setAdministeringId] = useState(null);

  const scannerRef = useRef(null);
  const isProcessingRef = useRef(false);
  const resultRef = useRef(null);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  async function processQrCode(qrString) {
    if (!qrString || !qrString.trim()) return;
    let cleanCode = qrString.trim();
    if (cleanCode.includes('code=')) {
      try {
        const parsed = new URL(cleanCode, window.location.origin);
        cleanCode = parsed.searchParams.get('code') || cleanCode;
      } catch (_) {}
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);
      const { data } = await api.post('/qr-codes/scan', { code: cleanCode });

      // Fetch pending schedules for this patient
      const schedRes = await api.get('/schedules/patient/' + data.data.patient.id, { params: { status: 'pending' } });

      setResult({ patient: data.data.patient, schedules: schedRes.data.data });
      setCode('');

      // Pause scanner while modal is displayed if camera is currently scanning
      try {
        if (scannerRef.current?.getState && scannerRef.current.getState() === 2) {
          scannerRef.current.pause(true);
        }
      } catch (_) {}
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or unassigned QR code.');
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 2000);
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setResult(null);
    setCode('');
    try {
      if (scannerRef.current?.getState && scannerRef.current.getState() === 3) {
        scannerRef.current.resume();
      }
    } catch (_) {}
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 1500);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.getElementById("qr-reader");
      if (!el) return;

      const scanner = new Html5QrcodeScanner("qr-reader", {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      }, false);
      scannerRef.current = scanner;

      scanner.render(
        async (decodedText) => {
          if (isProcessingRef.current || resultRef.current) return;
          isProcessingRef.current = true;
          await processQrCode(decodedText);
        },
        () => {
          // ignore frame scan errors
        }
      );
    }, 150);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => { });
      }
    };
  }, []);

  async function handleManualScan(e) {
    e?.preventDefault();
    if (isProcessingRef.current || resultRef.current) return;
    isProcessingRef.current = true;
    await processQrCode(code);
  }

  async function handleAdminister(id, medName = '') {
    try {
      setAdministeringId(id);
      await api.post(`/schedules/${id}/administer`, { notes: 'Administered via QR scan' });

      const patientName = result?.patient ? `${result.patient.first_name} ${result.patient.last_name}` : 'Patient';
      setSuccessToast(`${medName ? `${medName} dose` : 'Dose'} administered successfully for ${patientName}!`);
      setTimeout(() => setSuccessToast(''), 4000);

      // Close the modal and reset scanner immediately
      closeModal();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to administer dose.');
    } finally {
      setAdministeringId(null);
    }
  }

  return (
    <div style={{ maxWidth: 850, margin: '0 auto', padding: '24px 16px' }}>
      {/* Custom Styles */}
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
          display: none !important;
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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Success Notification */}
      {successToast && (
        <div style={{
          maxWidth: 500,
          margin: '0 auto 24px',
          padding: '14px 20px',
          background: '#ecfdf5',
          color: '#065f46',
          border: '1px solid #a7f3d0',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          textAlign: 'left',
          boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <CheckCircle size={22} color="#10b981" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, fontWeight: 600, fontSize: '0.95rem' }}>
            {successToast}
          </div>
          <button
            onClick={() => setSuccessToast('')}
            style={{ background: 'transparent', border: 'none', color: '#065f46', cursor: 'pointer', padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

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

      {/* POPUP MODAL FOR ADMINISTERING MEDICATION */}
      {result && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out',
            boxSizing: 'border-box'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 20,
              width: '100%',
              maxWidth: 540,
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
              animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Modal Header */}
            <div style={{
              background: '#f0fdf4',
              padding: '18px 24px',
              borderBottom: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  background: '#10b981',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 6px rgba(16, 185, 129, 0.25)',
                  flexShrink: 0
                }}>
                  <CheckCircle size={26} />
                </div>
                <div>
                  <div style={{ color: '#166534', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Patient Verified
                  </div>
                  <h3 style={{ margin: '2px 0 0', color: '#14532d', fontSize: '1.35rem', fontWeight: 800 }}>
                    {result.patient.first_name} {result.patient.last_name}
                  </h3>
                </div>
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Close"
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ padding: '6px 8px', background: '#f1f5f9', borderRadius: 8, color: '#475569' }}>
                  <Pill size={18} />
                </div>
                <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem', fontWeight: 700 }}>
                  Pending Medications
                </h4>
              </div>

              {result.schedules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 20px', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e2e8f0' }}>
                  <div style={{ width: 56, height: 56, background: '#f1f5f9', color: '#94a3b8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <CheckCircle size={28} />
                  </div>
                  <h5 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: '#334155' }}>All Clear!</h5>
                  <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>There are no pending medications for this patient at the moment.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {result.schedules.map(s => (
                    <div
                      key={s.id}
                      style={{
                        padding: '16px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 14,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem', wordBreak: 'break-word' }}>
                              {s.prescriptionItem?.medication_name}
                            </span>
                            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                              {s.prescriptionItem?.route?.replace('_', ' ')}
                            </span>
                          </div>
                          <div style={{ color: '#475569', fontSize: '0.92rem' }}>
                            <strong style={{ color: '#334155' }}>Dosage:</strong> {s.prescriptionItem?.dosage}
                          </div>
                        </div>

                        <button
                          style={{
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '10px 16px',
                            borderRadius: 10,
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            cursor: administeringId === s.id ? 'not-allowed' : 'pointer',
                            opacity: administeringId === s.id ? 0.7 : 1,
                            boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            flexShrink: 0
                          }}
                          disabled={administeringId === s.id}
                          onClick={() => handleAdminister(s.id, s.prescriptionItem?.medication_name)}
                        >
                          <CheckCircle size={16} />
                          {administeringId === s.id ? 'Administering...' : 'Administer Dose'}
                        </button>
                      </div>

                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '4px 10px', borderRadius: 6, color: '#64748b', fontSize: '0.82rem', width: 'fit-content' }}>
                        <Clock size={13} />
                        Scheduled: {new Date(s.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12
            }}>
              <button
                className="action-btn outline"
                onClick={closeModal}
                style={{ fontSize: '0.88rem', padding: '8px 18px', background: '#fff' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

