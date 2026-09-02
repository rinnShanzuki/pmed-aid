import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import {
  Users, Clock, CheckCircle2, AlertTriangle, Activity,
  BedDouble, RefreshCw, Loader2, Search, Filter
} from 'lucide-react';
import '../../styles/infoDesk.css';

// ─── Helpers ───────────────────────────────────────────────────────────
function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Badge Styles ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  overdue:      { bg: '#fee2e2', color: '#dc2626', label: 'Overdue' },
  in_progress:  { bg: '#dbeafe', color: '#2563eb', label: 'In Progress' },
  on_track:     { bg: '#dcfce7', color: '#16a34a', label: 'On Track' },
  not_yet_due:  { bg: '#f1f5f9', color: '#64748b', label: 'No Meds Due' },
  due_now:      { bg: '#fef3c7', color: '#d97706', label: 'Due Now' },
  pending:      { bg: '#f1f5f9', color: '#64748b', label: 'Pending' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_yet_due;
  return (
    <span style={{
      display: 'inline-block', padding: '4px 12px', borderRadius: 9999,
      fontSize: '0.75rem', fontWeight: 700, background: cfg.bg, color: cfg.color,
      letterSpacing: '0.02em', textTransform: 'capitalize',
    }}>
      {cfg.label}
    </span>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, bg, color }) {
  return (
    <div className="id-card" style={{ margin: 0, padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
        </div>
      </div>
      {sub && <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 8 }}>{sub}</div>}
    </div>
  );
}

// ─── Search/Filter Toolbar ─────────────────────────────────────────────
const inputStyle = {
  padding: '8px 12px 8px 36px', borderRadius: 8, border: '1px solid #e2e8f0',
  fontSize: '0.85rem', outline: 'none', width: '100%', maxWidth: 280,
  background: '#f8fafc', transition: 'border 0.2s',
};
const selectStyle = {
  padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
  fontSize: '0.85rem', outline: 'none', background: '#f8fafc', cursor: 'pointer',
  color: '#334155',
};

function TableToolbar({ searchValue, onSearchChange, searchPlaceholder, statusValue, onStatusChange, statusOptions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 300 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder={searchPlaceholder || 'Search...'}
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = '#3b82f6'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
      </div>
      {statusOptions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={15} style={{ color: '#94a3b8' }} />
          <select value={statusValue} onChange={e => onStatusChange(e.target.value)} style={selectStyle}>
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────
function EmptyState({ message, color = '#64748b' }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 16px', color, fontSize: '0.9rem' }}>
      {message}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// GENERAL DASHBOARD — No sidebar, full-width, standalone page
// ════════════════════════════════════════════════════════════════════════
export default function GeneralDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search/filter state
  const [wardSearch, setWardSearch] = useState('');
  const [wardStatusFilter, setWardStatusFilter] = useState('all');

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get('/info-desk/medication-dashboard');
      setData(res.data.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => fetchDashboard(), 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  // ─── Loading ──
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Loading general dashboard…</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const { summary, wardOverview } = data || {};
  const s = summary || { totalConfined: 0, givenOnTime: { count: 0, pct: 0 }, overdueMissed: { count: 0, pct: 0 }, pendingUpcoming: 0, inProgress: 0 };

  // Apply filters
  const filteredWard = (wardOverview || []).filter(row => {
    const matchesSearch = wardSearch === '' ||
      row.patientName.toLowerCase().includes(wardSearch.toLowerCase()) ||
      row.roomNumber.toLowerCase().includes(wardSearch.toLowerCase()) ||
      row.attendingPhysician.toLowerCase().includes(wardSearch.toLowerCase()) ||
      row.assignedNurse.toLowerCase().includes(wardSearch.toLowerCase());
    const matchesStatus = wardStatusFilter === 'all' || row.statusBadge === wardStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{
      minHeight: '100vh', background: '#f8fafc',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* ── Main Content ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 32px' }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>General Medication Dashboard</h2>
            <p style={{ color: '#64748b', margin: '4px 0 0' }}>Real-time overview — auto-refreshes every 30 seconds.</p>
          </div>
          <button
            className="action-btn outline"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            style={{ gap: 6 }}
          >
            <RefreshCw size={16} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* ════ SECTION 1 — Top Summary Bar ════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 16, marginBottom: 28 }}>
          <StatCard
            icon={<BedDouble size={24} />} label="Total Confined" value={s.totalConfined}
            sub="Currently admitted patients" bg="#eff6ff" color="#3b82f6"
          />
          <StatCard
            icon={<CheckCircle2 size={24} />} label="Given On Time"
            value={<>{s.givenOnTime.count} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#16a34a' }}>({s.givenOnTime.pct}%)</span></>}
            sub="Doses completed on schedule" bg="#f0fdf4" color="#22c55e"
          />
          <StatCard
            icon={<AlertTriangle size={24} />} label="Overdue / Missed"
            value={<>{s.overdueMissed.count} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#dc2626' }}>({s.overdueMissed.pct}%)</span></>}
            sub="Passed scheduled time" bg="#fef2f2" color="#ef4444"
          />
          <StatCard
            icon={<Clock size={24} />} label="Pending / Upcoming" value={s.pendingUpcoming}
            sub="Due within the next hour" bg="#fffbeb" color="#d97706"
          />
          <StatCard
            icon={<Activity size={24} />} label="In Progress" value={s.inProgress}
            sub="Nurse mid-administration" bg="#f0f9ff" color="#0284c7"
          />
        </div>

        {/* ════ SECTION 2 — Room / Ward Overview ════ */}
        <div className="id-card">
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={20} /> Room / Ward Overview
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              All confined patients and their current medication status
            </p>
          </div>

          <TableToolbar
            searchValue={wardSearch}
            onSearchChange={setWardSearch}
            searchPlaceholder="Search patient, room, doctor, nurse…"
            statusValue={wardStatusFilter}
            onStatusChange={setWardStatusFilter}
            statusOptions={[
              { value: 'all', label: 'All Statuses' },
              { value: 'on_track', label: 'On Track' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'not_yet_due', label: 'No Meds Due' },
            ]}
          />

          <div className="id-table-container">
            <table className="id-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Room / Bed</th>
                  <th>Attending Physician</th>
                  <th>Assigned Nurse</th>
                  <th>Admission Date</th>
                  <th>Status</th>
                  <th>Next Medication Due</th>
                </tr>
              </thead>
              <tbody>
                {filteredWard.length === 0 ? (
                  <tr><td colSpan={7}>
                    <EmptyState message={wardSearch || wardStatusFilter !== 'all'
                      ? 'No patients match your search / filter.'
                      : 'No confined patients at this time.'} />
                  </td></tr>
                ) : filteredWard.map(row => (
                  <tr key={row.admissionId}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{row.patientName}</td>
                    <td>{row.roomNumber}</td>
                    <td>{row.attendingPhysician}</td>
                    <td>{row.assignedNurse}</td>
                    <td>{formatDate(row.admissionDate)}</td>
                    <td><StatusBadge status={row.statusBadge} /></td>
                    <td>
                      {row.nextMedDue ? (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{formatTime(row.nextMedDue)}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{row.nextMedName}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>None scheduled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ════ Status Legend ════ */}
        <div className="id-card" style={{ padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginRight: 8 }}>Status Legend:</span>
            {[
              { color: '#3b82f6', label: 'In Progress / Being Attended To' },
              { color: '#22c55e', label: 'Completed / Given On Time' },
              { color: '#ef4444', label: 'Missed / Overdue' },
              { color: '#94a3b8', label: 'Not Yet Due / Scheduled' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: '#475569' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spin animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
