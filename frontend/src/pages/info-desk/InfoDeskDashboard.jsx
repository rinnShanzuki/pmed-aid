import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { BedDouble, Users, FileSignature, Clock } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function InfoDeskDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ newAdmissions: 0, activePatients: 0, recentPrescriptions: 0, pendingAdmissions: 0, dischargedPatients: 0, admissionTrend: [], adherenceTrend: [] });

  useEffect(() => {
    api.get('/info-desk/dashboard')
      .then(({ data }) => setStats(data.data))
      .catch(err => console.error('Dashboard fetch error:', err));
  }, []);

  const statCards = [
    { label: 'New Admissions Today', value: stats.newAdmissions, sub: 'Patients admitted today', icon: <BedDouble size={20} />, bg: '#eff6ff', color: '#3b82f6', route: '/info-desk/admissions', state: { tab: 'admitted', filter: 'today' } },
    { label: 'Total Active Patients', value: stats.activePatients, sub: 'Currently in rooms', icon: <Users size={20} />, bg: '#fdf4ff', color: '#d946ef', route: '/info-desk/monitoring' },
    { label: 'Recent Prescriptions', value: stats.recentPrescriptions, sub: 'Encoded in last 7 days', icon: <FileSignature size={20} />, bg: '#f0fdf4', color: '#22c55e', route: '/info-desk/prescriptions', state: { tab: 'all', filter: 'recent' } },
    { label: 'Pending Admissions', value: stats.pendingAdmissions, sub: 'Require room assignment', icon: <Clock size={20} />, bg: '#fff7ed', color: '#f97316', route: '/info-desk/admissions', state: { tab: 'pending_admissions' } },
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
    { name: 'Pending Admission', value: stats.pendingAdmissions },
  ];

  const COLORS = ['#3b82f6', '#22c55e', '#f97316'];

  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>Overview</h2>
        <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.88rem' }}>Welcome to the Information Desk Portal.</p>
      </div>

      <div className="id-stats-grid">
        {statCards.map((card) => (
          <div
            className="stat-card-responsive hover-card"
            key={card.label}
            onClick={() => navigate(card.route, { state: card.state })}
          >
            <div className="stat-card-top">
              <div className="stat-card-icon-box" style={{ background: card.bg, color: card.color }}>
                {card.icon}
              </div>
              <div className="stat-card-text">
                <label className="stat-card-label" title={card.label}>{card.label}</label>
                <div className="stat-card-value">{card.value}</div>
              </div>
            </div>
            <p className="stat-card-sub" title={card.sub}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Medication Adherence Trend (Line Chart) ── */}
      <div className="id-card" style={{ marginTop: 24, minWidth: 0, width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', color: '#0f172a' }}>Medication Adherence Trend</h3>
        <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 20 }}>7-day movement of medication adherence — given on time vs. overdue / missed doses.</p>
        <div style={{ width: '100%', height: 300, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.adherenceTrend.length > 0 ? stats.adherenceTrend : [{ date: '—', givenPct: 0, overduePct: 0 }]} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value, name) => [`${value}%`, name === 'givenPct' ? 'Given On Time' : 'Overdue / Missed']}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: '0.85rem', paddingTop: '16px' }}
                formatter={(value) => value === 'givenPct' ? 'Given / Administered' : 'Overdue / Missed'}
              />
              <Line type="monotone" dataKey="givenPct" stroke="#22c55e" strokeWidth={3} dot={{ r: 5, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="overduePct" stroke="#ef4444" strokeWidth={3} dot={{ r: 5, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>


      <div className="id-charts-grid">
        <div className="id-card" style={{ marginBottom: 0 }}>
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
