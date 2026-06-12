import { useState, useEffect } from 'react';
import api from '../../services/api';
import { BedDouble, Users, FileSignature, Clock } from 'lucide-react';

export default function InfoDeskDashboard() {
  const [stats, setStats] = useState({ newAdmissions: 0, activePatients: 0, recentPrescriptions: 0, pendingRegistrations: 0 });

  useEffect(() => {
    api.get('/info-desk/dashboard')
      .then(({ data }) => setStats(data.data))
      .catch(err => console.error('Dashboard fetch error:', err));
  }, []);

  const statCards = [
    { label: 'New Admissions Today', value: stats.newAdmissions, sub: 'Patients admitted today', icon: <BedDouble size={24} />, bg: '#eff6ff', color: '#3b82f6' },
    { label: 'Total Active Patients', value: stats.activePatients, sub: 'Currently in rooms', icon: <Users size={24} />, bg: '#fdf4ff', color: '#d946ef' },
    { label: 'Recent Prescriptions', value: stats.recentPrescriptions, sub: 'Encoded in the last 7 days', icon: <FileSignature size={24} />, bg: '#f0fdf4', color: '#22c55e' },
    { label: 'Pending Registrations', value: stats.pendingRegistrations, sub: 'Require profile completion', icon: <Clock size={24} />, bg: '#fff7ed', color: '#f97316' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Overview</h2>
        <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Welcome to the Information Desk Portal.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        {statCards.map((card) => (
          <div className="id-card" key={card.label} style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ background: card.bg, color: card.color, width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {card.icon}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{card.label}</label>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>{card.value}</div>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>{card.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '32px' }}>
        <div className="id-card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#0f172a' }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button className="action-btn primary" onClick={() => window.location.href = '/info-desk/registration'}>+ Register New Patient</button>
            <button className="action-btn outline" onClick={() => window.location.href = '/info-desk/admissions'}>View Admissions</button>
            <button className="action-btn outline" onClick={() => window.location.href = '/info-desk/qr-codes'}>Generate QR Code</button>
          </div>
        </div>
      </div>
    </div>
  );
}
