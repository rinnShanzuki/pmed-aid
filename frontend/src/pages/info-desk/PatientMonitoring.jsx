import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  Users, Clock, CheckCircle2, AlertTriangle, Activity,
  BedDouble, Pill, Bell, ChevronRight, RefreshCw, Loader2, Search, Filter
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────
function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeRemaining(scheduledTime) {
  const diff = new Date(scheduledTime) - new Date();
  const mins = Math.round(Math.abs(diff) / 60000);
  if (diff < 0) return { label: `${mins} min${mins !== 1 ? 's' : ''} overdue`, isOverdue: true };
  if (mins < 60) return { label: `in ${mins} min${mins !== 1 ? 's' : ''}`, isOverdue: false };
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return { label: `in ${hrs}h ${rem}m`, isOverdue: false };
}

// ─── Badge Styles ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  overdue: { bg: '#fee2e2', color: '#dc2626', label: 'Overdue' },
  in_progress: { bg: '#dbeafe', color: '#2563eb', label: 'In Progress' },
  on_track: { bg: '#dcfce7', color: '#16a34a', label: 'On Track' },
  not_yet_due: { bg: '#f1f5f9', color: '#64748b', label: 'No Meds Due' },
  due_now: { bg: '#fef3c7', color: '#d97706', label: 'Due Now' },
  pending: { bg: '#f1f5f9', color: '#64748b', label: 'Pending' },
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

// ─── Section Header ────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle, color = '#0f172a' }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color, display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon} {title}
      </h3>
      {subtitle && <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>{subtitle}</p>}
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
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════
// ─── Search/Filter Bar ─────────────────────────────────────────────────
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

export default function PatientMonitoring() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const [nurses, setNurses] = useState([]);
  const [administerModal, setAdministerModal] = useState(null);
  const [administerForm, setAdministerForm] = useState({ administered_by: '', administered_at: '' });

  // Search & filter state
  const [wardSearch, setWardSearch] = useState('');
  const [wardStatusFilter, setWardStatusFilter] = useState('all');
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingStatusFilter, setPendingStatusFilter] = useState('all');
  const [pendingTypeFilter, setPendingTypeFilter] = useState('admitted'); // 'admitted' | 'outpatient' | 'all'
  const [overdueSearch, setOverdueSearch] = useState('');
  const [overdueTypeFilter, setOverdueTypeFilter] = useState('admitted'); // 'admitted' | 'outpatient' | 'all'

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
    api.get('/users', { params: { role: 'nurse' } }).then(res => setNurses(res.data.data)).catch(console.error);
    const interval = setInterval(() => fetchDashboard(), 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  // ─── Actions ──
  function handleAdminister(scheduleId) {
    // Round to nearest minute for datetime-local
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const formattedNow = now.toISOString().slice(0, 16);

    setAdministerForm({
      administered_by: '',
      administered_at: formattedNow
    });
    setAdministerModal(scheduleId);
  }

  async function submitAdminister(e) {
    e.preventDefault();
    if (!administerModal) return;

    setActionLoading(prev => ({ ...prev, [administerModal]: 'administer' }));
    try {
      await api.post(`/schedules/${administerModal}/administer`, {
        status: 'pending',
        notes: 'Rescheduled and re-assigned via Information Desk dashboard',
        administered_by: administerForm.administered_by,
        scheduled_time: new Date(administerForm.administered_at).toISOString()
      });
      setAdministerModal(null);
      await fetchDashboard(true);
    } catch (err) {
      console.error('Administer failed:', err);
      alert(err.response?.data?.message || 'Failed to administer medication.');
    } finally {
      setActionLoading(prev => ({ ...prev, [administerModal]: null }));
    }
  }

  // ─── Loading State ──
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Loading medication dashboard…</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const { summary, wardOverview, pendingSchedule, overdueList } = data || {};
  const s = summary || { totalConfined: 0, givenOnTime: { count: 0, pct: 0 }, overdueMissed: { count: 0, pct: 0 }, pendingUpcoming: 0, inProgress: 0 };

  // ─── Apply filters ──
  const filteredWard = (wardOverview || []).filter(row => {
    const matchesSearch = wardSearch === '' || row.patientName.toLowerCase().includes(wardSearch.toLowerCase()) || row.roomNumber.toLowerCase().includes(wardSearch.toLowerCase()) || row.attendingPhysician.toLowerCase().includes(wardSearch.toLowerCase()) || row.assignedNurse.toLowerCase().includes(wardSearch.toLowerCase());
    const matchesStatus = wardStatusFilter === 'all' || row.statusBadge === wardStatusFilter;
    return matchesSearch && matchesStatus;
  });
  const filteredPending = (pendingSchedule || []).filter(row => {
    const isAdmitted = row.roomNumber !== 'N/A';
    if (pendingTypeFilter === 'admitted' && !isAdmitted) return false;
    if (pendingTypeFilter === 'outpatient' && isAdmitted) return false;

    const matchesSearch = pendingSearch === '' || row.patientName.toLowerCase().includes(pendingSearch.toLowerCase()) || row.roomNumber.toLowerCase().includes(pendingSearch.toLowerCase()) || row.medicationName.toLowerCase().includes(pendingSearch.toLowerCase()) || row.assignedNurse.toLowerCase().includes(pendingSearch.toLowerCase());
    const matchesStatus = pendingStatusFilter === 'all' || row.status === pendingStatusFilter;
    return matchesSearch && matchesStatus;
  });
  const filteredOverdue = (overdueList || []).filter(row => {
    const isAdmitted = row.roomNumber !== 'N/A';
    if (overdueTypeFilter === 'admitted' && !isAdmitted) return false;
    if (overdueTypeFilter === 'outpatient' && isAdmitted) return false;

    const matchesSearch = overdueSearch === '' || row.patientName.toLowerCase().includes(overdueSearch.toLowerCase()) || row.roomNumber.toLowerCase().includes(overdueSearch.toLowerCase()) || row.medicationName.toLowerCase().includes(overdueSearch.toLowerCase()) || row.assignedNurse.toLowerCase().includes(overdueSearch.toLowerCase());
    return matchesSearch;
  });

  return (
    <div>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
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

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 1 — Top Summary Bar                                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 2 — Room / Ward Overview                              */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="id-card">
        <SectionHeader
          icon={<Users size={20} />}
          title="Room / Ward Overview"
          subtitle="All confined patients — click a row to see full details"
        />
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
                <tr><td colSpan={7}><EmptyState message={wardSearch || wardStatusFilter !== 'all' ? 'No patients match your search / filter.' : 'No confined patients at this time.'} /></td></tr>
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

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 4 — Pending / Upcoming Schedule Queue                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="id-card">
        <SectionHeader
          icon={<Clock size={20} color="#d97706" />}
          title="Pending / Upcoming Schedule"
          subtitle="Scheduled doses not yet administered — sorted by urgency"
          color="#92400e"
        />
        <TableToolbar
          searchValue={pendingSearch}
          onSearchChange={setPendingSearch}
          searchPlaceholder="Search patient, room, medication, nurse…"
          statusValue={pendingStatusFilter}
          onStatusChange={setPendingStatusFilter}
          statusOptions={[
            { value: 'all', label: 'All Statuses' },
            { value: 'due_now', label: 'Due Now' },
            { value: 'pending', label: 'Pending' },
          ]}
        />
        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #e2e8f0', marginBottom: 16, padding: '0 2px' }}>
          <button
            style={{ padding: '8px 4px', background: 'none', border: 'none', borderBottom: pendingTypeFilter === 'admitted' ? '2px solid #3b82f6' : '2px solid transparent', color: pendingTypeFilter === 'admitted' ? '#3b82f6' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', outline: 'none' }}
            onClick={() => setPendingTypeFilter('admitted')}
          >
            Admitted Patients
          </button>
          <button
            style={{ padding: '8px 4px', background: 'none', border: 'none', borderBottom: pendingTypeFilter === 'outpatient' ? '2px solid #3b82f6' : '2px solid transparent', color: pendingTypeFilter === 'outpatient' ? '#3b82f6' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', outline: 'none' }}
            onClick={() => setPendingTypeFilter('outpatient')}
          >
            Outpatients
          </button>
        </div>
        <div className="id-table-container">
          <table className="id-table">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Room</th>
                <th>Medication</th>
                <th>Scheduled Time</th>
                <th>Assigned Nurse</th>
                <th>Time Remaining</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPending.length === 0 ? (
                <tr><td colSpan={7}><EmptyState message={pendingSearch || pendingStatusFilter !== 'all' ? 'No doses match your search / filter.' : 'No pending medications. All doses accounted for!'} color="#16a34a" /></td></tr>
              ) : filteredPending.map(row => {
                const tr = timeRemaining(row.scheduledTime);
                return (
                  <tr key={row.scheduleId}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{row.patientName}</td>
                    <td>{row.roomNumber}</td>
                    <td>{row.medicationName}</td>
                    <td style={{ fontWeight: 600 }}>{formatTime(row.scheduledTime)}</td>
                    <td>{row.assignedNurse}</td>
                    <td>
                      <span style={{
                        fontWeight: 700, fontSize: '0.85rem',
                        color: row.status === 'due_now' ? '#d97706' : '#64748b',
                      }}>
                        {tr.label}
                      </span>
                    </td>
                    <td><StatusBadge status={row.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 5 — Overdue / Missed List                             */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="id-card" style={{ borderTop: '4px solid #ef4444' }}>
        <SectionHeader
          icon={<AlertTriangle size={20} color="#dc2626" />}
          title="Overdue / Missed Medications"
          subtitle="These doses need immediate attention"
          color="#991b1b"
        />
        <TableToolbar
          searchValue={overdueSearch}
          onSearchChange={setOverdueSearch}
          searchPlaceholder="Search patient, room, medication, nurse…"
        />
        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #e2e8f0', marginBottom: 16, padding: '0 2px' }}>
          <button
            style={{ padding: '8px 4px', background: 'none', border: 'none', borderBottom: overdueTypeFilter === 'admitted' ? '2px solid #ef4444' : '2px solid transparent', color: overdueTypeFilter === 'admitted' ? '#dc2626' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', outline: 'none' }}
            onClick={() => setOverdueTypeFilter('admitted')}
          >
            Admitted Patients
          </button>
          <button
            style={{ padding: '8px 4px', background: 'none', border: 'none', borderBottom: overdueTypeFilter === 'outpatient' ? '2px solid #ef4444' : '2px solid transparent', color: overdueTypeFilter === 'outpatient' ? '#dc2626' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', outline: 'none' }}
            onClick={() => setOverdueTypeFilter('outpatient')}
          >
            Outpatients
          </button>
        </div>
        <div className="id-table-container">
          <table className="id-table">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Room</th>
                <th>Medication</th>
                <th>Scheduled Time</th>
                <th>How Overdue</th>
                <th>Assigned Nurse</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOverdue.length === 0 ? (
                <tr><td colSpan={7}><EmptyState message={overdueSearch ? 'No overdue doses match your search.' : 'No overdue medications. All doses on track! ✓'} color="#16a34a" /></td></tr>
              ) : filteredOverdue.map(row => (
                <tr key={row.scheduleId} style={{ background: '#fef2f2' }}>
                  <td style={{ fontWeight: 600, color: '#991b1b' }}>{row.patientName}</td>
                  <td>{row.roomNumber}</td>
                  <td>{row.medicationName}</td>
                  <td style={{ fontWeight: 600, color: '#dc2626' }}>{formatTime(row.scheduledTime)}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: '#fee2e2', color: '#dc2626', padding: '4px 10px',
                      borderRadius: 9999, fontSize: '0.8rem', fontWeight: 700,
                    }}>
                      <AlertTriangle size={12} />
                      {row.minutesOverdue} min{row.minutesOverdue !== 1 ? 's' : ''} late
                    </span>
                  </td>
                  <td>{row.assignedNurse}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        className="action-btn primary"
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                        onClick={() => handleAdminister(row.scheduleId)}
                        disabled={actionLoading[row.scheduleId] === 'administer'}
                      >
                        {actionLoading[row.scheduleId] === 'administer' ? (
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        Administer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 6 — Color / Status Legend                             */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="id-card" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginRight: 8 }}>Status Legend:</span>
          {[
            { emoji: '🔵', color: '#3b82f6', label: 'In Progress / Being Attended To' },
            { emoji: '🟢', color: '#22c55e', label: 'Completed / Given On Time' },
            { emoji: '🔴', color: '#ef4444', label: 'Missed / Overdue' },
            { emoji: '⚪', color: '#94a3b8', label: 'Not Yet Due / Scheduled' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.82rem', color: '#475569' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Spin keyframe for loaders */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Administer Modal */}
      {administerModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setAdministerModal(null)}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 400, padding: 24, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Reschedule Dose</h3>
              <button onClick={() => setAdministerModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={submitAdminister}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 8 }}>Administered By (Nurse) *</label>
                <select
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  value={administerForm.administered_by}
                  onChange={e => setAdministerForm({ ...administerForm, administered_by: e.target.value })}
                  required
                >
                  <option value="">Select Nurse</option>
                  {nurses.map(n => <option key={n.id} value={n.id}>{n.first_name} {n.last_name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 8 }}>Time of Delivery *</label>
                <input
                  type="datetime-local"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  value={administerForm.administered_at}
                  onChange={e => setAdministerForm({ ...administerForm, administered_at: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="action-btn outline" onClick={() => setAdministerModal(null)}>Cancel</button>
                <button type="submit" className="action-btn primary" disabled={actionLoading[administerModal] === 'administer'}>
                  {actionLoading[administerModal] === 'administer' ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
