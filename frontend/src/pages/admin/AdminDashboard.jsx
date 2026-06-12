import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users, Stethoscope, HeartPulse, Activity,
  TrendingUp, CalendarDays, FileText
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f43f5e'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [admissionView, setAdmissionView] = useState('monthly'); // 'daily', 'weekly', 'monthly'

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const { data } = await api.get('/admin/dashboard');
        setStats(data.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="empty-state">
        <Activity size={48} />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Patients',
      value: stats?.totalPatients ?? 0,
      sub: 'Total registered patients',
      icon: <Users size={22} />,
      bg: '#eff6ff',
      color: '#3b82f6',
    },
    {
      label: 'Active Patients',
      value: stats?.activePatients ?? 0,
      sub: 'Currently admitted patients',
      icon: <Activity size={22} />,
      bg: '#fdf4ff',
      color: '#d946ef',
    },
    {
      label: 'Total Doctors',
      value: stats?.totalDoctors ?? 0,
      sub: 'Registered doctors',
      icon: <Stethoscope size={22} />,
      bg: '#f0fdf4',
      color: '#22c55e',
    },
    {
      label: 'Total Nurses',
      value: stats?.totalNurses ?? 0,
      sub: 'Registered nurses',
      icon: <HeartPulse size={22} />,
      bg: '#fff7ed',
      color: '#f97316',
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Top KPI Cards</h2>
      </div>

      {/* ── Stat Cards ── */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {statCards.map((card) => (
          <div className="stat-card" key={card.label} style={{ flexDirection: 'column', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div className="stat-card-icon" style={{ background: card.bg, color: card.color }}>
                {card.icon}
              </div>
              <div className="stat-card-info" style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem' }}>{card.label}</label>
                <span className="stat-value" style={{ fontSize: '2rem' }}>{card.value}</span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{card.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ margin: '32px 0 24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Dashboard Charts</h2>
      </div>

      {/* ── Charts Grid ── */}
      <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* 1. Monthly Medication Adherence Trend */}
        <div className="chart-card">
          <h3>
            <TrendingUp size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
            Monthly Medication Adherence Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.adherenceTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 8, color: '#f8fafc' }}
                itemStyle={{ color: '#38bdf8' }}
                formatter={(val) => [`${val}%`, 'Adherence']}
              />
              <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Medication Status Distribution */}
        <div className="chart-card">
          <h3>
            <Activity size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
            Medication Status Distribution
          </h3>
          <div style={{ display: 'flex', height: 300, alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.medicationDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {(stats?.medicationDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   formatter={(value) => `${value}%`}
                   contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Patient Admission Trend */}
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>
              <CalendarDays size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
              Patient Admission Trend
            </h3>
            <div style={{ display: 'flex', gap: 8, background: '#f1f5f9', padding: 4, borderRadius: 8 }}>
              {['daily', 'weekly', 'monthly'].map(view => (
                <button
                  key={view}
                  onClick={() => setAdmissionView(view)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: admissionView === view ? '#fff' : 'transparent',
                    color: admissionView === view ? '#0f172a' : '#64748b',
                    boxShadow: admissionView === view ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s'
                  }}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats?.admissionTrend?.[admissionView] || []} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="value" name="Admissions" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 4. Medication Adherence Rate (Moved from KPI) */}
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ marginBottom: '8px' }}>
            <TrendingUp size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
            Overall Medication Adherence
          </h3>
          <p style={{ margin: '0 0 24px 0', fontSize: '0.85rem', color: '#64748b' }}>
            Current tracking of patient adherence percentage.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#1e293b' }}>
              {stats?.adherenceRate ?? 0}%
            </div>
            <div style={{ flex: 1, height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.adherenceTrend || []}>
                  <Line type="monotone" dataKey="rate" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', r: 4 }} />
                  <YAxis domain={['dataMin - 10', 100]} hide />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 8, color: '#f8fafc' }}
                    itemStyle={{ color: '#c084fc' }}
                    formatter={(val) => [`${val}%`, 'Adherence']}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
