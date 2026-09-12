import React, { useEffect, useState } from "react";
import "./PrescriptionDocument.css";

/**
 * Printable discharge prescription document.
 * Layout order (matches the physical printout): hospital header ->
 * patient info -> prescription list -> QR code for the patient portal.
 *
 * Usage:
 *   <PrescriptionDocument patientId={patient.id} apiBaseUrl="/api" />
 */
export default function PrescriptionDocument({ patientId, apiBaseUrl = "/api" }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBaseUrl}/prescriptions/${patientId}/discharge`);
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (patientId) load();
    return () => {
      cancelled = true;
    };
  }, [patientId, apiBaseUrl]);

  if (loading) return <div className="rx-doc-status">Loading prescription document…</div>;
  if (error) return <div className="rx-doc-status rx-doc-status--error">Couldn't load document: {error}</div>;
  if (!data) return null;

  const { patient, dischargeDate, prescriptions, qrCodeDataUrl } = data;

  return (
    <div className="rx-doc-wrapper">
      {/* Toolbar is hidden automatically when printing (see CSS) */}
      <div className="rx-doc-toolbar">
        <button className="rx-doc-print-btn" onClick={() => window.print()}>
          Print prescription
        </button>
      </div>

      <div className="rx-doc-page" id="prescription-print-area">
        <header className="rx-doc-header">
          <div className="rx-doc-hospital-name">Sample General Hospital</div>
          <div className="rx-doc-hospital-meta">
            123 Health Ave, Metro City &nbsp;•&nbsp; (02) 555-0134 &nbsp;•&nbsp; www.samplehospital.ph
          </div>
        </header>

        <section className="rx-doc-patient-info">
          <div>
            <span className="rx-doc-label">Patient</span>
            <span className="rx-doc-value">{patient.name}</span>
          </div>
          <div>
            <span className="rx-doc-label">MRN</span>
            <span className="rx-doc-value">{patient.patientCode}</span>
          </div>
          <div>
            <span className="rx-doc-label">Room</span>
            <span className="rx-doc-value">{patient.room}</span>
          </div>
          <div>
            <span className="rx-doc-label">Attending Physician</span>
            <span className="rx-doc-value">{patient.attendingPhysician}</span>
          </div>
          <div>
            <span className="rx-doc-label">Date Issued</span>
            <span className="rx-doc-value">
              {new Date(dischargeDate).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </section>

        <section className="rx-doc-rx-section">
          <h2 className="rx-doc-section-title">Take-Home Medications</h2>
          <table className="rx-doc-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th>Instructions</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((rx) => (
                <tr key={rx.id}>
                  <td className="rx-doc-med-name">{rx.medicineName}</td>
                  <td>{rx.dosage}</td>
                  <td>{rx.frequency}</td>
                  <td>{rx.durationDays} day{rx.durationDays === 1 ? "" : "s"}</td>
                  <td>{rx.instructions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rx-doc-qr-section">
          <img
            className="rx-doc-qr-img"
            src={qrCodeDataUrl}
            alt="Scan to link your medication portal account"
            width={160}
            height={160}
          />
          <p className="rx-doc-qr-caption">
            Scan this code to set up medication reminders and track your intake
            in the patient app. Linking is permanent to this account for your security.
          </p>
        </section>

        <footer className="rx-doc-footer">
          <div className="rx-doc-signature-line">
            <span>{patient.attendingPhysician}</span>
            <span className="rx-doc-signature-label">Physician's Signature</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
