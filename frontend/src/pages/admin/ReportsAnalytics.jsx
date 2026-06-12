import { useState, useEffect } from 'react';
import api from '../../services/api';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899'];

export default function ReportsAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await api.get('/admin/dashboard');
        setStats(data.data);
      } catch (err) {
        console.error(err);
        // fallback data
        setStats({
          totalPatients: 0,
          totalDoctors: 0,
          totalNurses: 0,
          adherenceRate: 0,
          analyticsGraphs: {
            admissions: [
              { month: 'Jan', value: 12 }, { month: 'Feb', value: 19 },
              { month: 'Mar', value: 15 }, { month: 'Apr', value: 22 },
              { month: 'May', value: 30 },
            ],
            adherence: [
              { month: 'Jan', rate: 85 }, { month: 'Feb', rate: 88 },
              { month: 'Mar', rate: 92 }, { month: 'Apr', rate: 90 },
              { month: 'May', rate: 95 },
            ]
          }
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="empty-state">
        <Activity size={48} />
        <p>Loading reports...</p>
      </div>
    );
  }

  const staffDistribution = [
    { name: 'Doctors', value: stats?.totalDoctors || 0 },
    { name: 'Nurses', value: stats?.totalNurses || 0 },
    { name: 'Patients', value: stats?.totalPatients || 0 },
  ].filter(d => d.value > 0);

  return (
    <>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: 20 }}>
        <BarChart3 size={20} style={{ display: 'inline', marginRight: 10, verticalAlign: 'text-bottom' }} />
        Reports & Analytics
      </h2>

      <div className="charts-grid">
        {/* Adherence Report */}
        <div className="chart-card">
          <h3>
            <TrendingUp size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
            Medication Adherence Report
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats?.analyticsGraphs?.adherence || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 8, fontSize: '0.82rem', color: '#e2e8f0' }}
              />
              <Line type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Admissions Report */}
        <div className="chart-card">
          <h3>Hospital Admissions Over Time</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats?.analyticsGraphs?.admissions || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 8, fontSize: '0.82rem', color: '#e2e8f0' }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Staff Distribution Pie */}
      <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="chart-card">
          <h3>Staff & Patient Distribution</h3>
          {staffDistribution.length === 0 ? (
            <div className="empty-state"><p>No data to display yet.</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={staffDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {staffDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Hospital Statistics Summary</h3>
          <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Total Patients', value: stats?.totalPatients || 0, color: '#3b82f6' },
              { label: 'Total Doctors', value: stats?.totalDoctors || 0, color: '#22c55e' },
              { label: 'Total Nurses', value: stats?.totalNurses || 0, color: '#f97316' },
              { label: 'Adherence Rate', value: `${stats?.adherenceRate || 0}%`, color: '#a855f7' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1e293b' }}>{item.label}</span>
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
