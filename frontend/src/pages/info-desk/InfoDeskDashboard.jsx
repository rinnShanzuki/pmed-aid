import { useState, useEffect } from 'react';
import api from '../../services/api';
import { BedDouble, Users, FileSignature, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function InfoDeskDashboard() {
  const [stats, setStats] = useState({ newAdmissions: 0, activePatients: 0, recentPrescriptions: 0, pendingRegistrations: 0, dischargedPatients: 0, admissionTrend: [] });

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

  const admissionTrendData = stats.admissionTrend && stats.admissionTrend.length > 0 
    ? stats.admissionTrend 
    : [
        { day: 'Mon', admissions: 0 },
        { day: 'Tue', admissions: 0 },
        { day: 'Wed', admissions: 0 },
        { day: 'Thu', admissions: 0 },
        { day: 'Fri', admissions: 0 },
      ];

  const patientStatusData = [
    { name: 'Admitted', value: stats.activePatients },
    { name: 'Discharged', value: stats.dischargedPatients },
    { name: 'Pending Registration', value: stats.pendingRegistrations },
  ];

  const COLORS = ['#3b82f6', '#22c55e', '#f97316'];

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '32px' }}>
        <div className="id-card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#0f172a' }}>Admission Trend</h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 24 }}>Track patient admissions over the week.</p>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={admissionTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="admissions" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="id-card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#0f172a' }}>Patient Status Distribution</h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 24 }}>Quick overview of patient current states.</p>
          <div style={{ width: '100%', height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={patientStatusData}
                  cx="50%"
                  cy="45%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {patientStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.85rem', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


    </div>
  );
}
