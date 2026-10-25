import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Pill,
  Search,
  Filter,
  RefreshCw,
  X,
  QrCode,
  BedDouble,
  User as UserIcon,
  Activity
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function MedMonitoring() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState('all_pending'); // all_pending, overdue, due_soon, completed, all
  const [search, setSearch] = useState('');
  const [selectedPatientFilter, setSelectedPatientFilter] = useState('');

  const fetchStatus = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const { data } = await api.get('/schedules');
      setSchedules(data.data || []);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus(true), 60000); // auto-refresh every minute
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const now = new Date();
  const soonThreshold = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // Categorize schedules
  const overdueList = schedules.filter(s =>
    s.status === 'pending' && new Date(s.scheduled_time) < now
  );

  const dueSoonList = schedules.filter(s =>
    s.status === 'pending' &&
    new Date(s.scheduled_time) >= now &&
    new Date(s.scheduled_time) <= soonThreshold
  );

  const allPendingList = schedules.filter(s => s.status === 'pending');

  const completedTodayList = schedules.filter(s =>
    s.status === 'completed' &&
    new Date(s.administered_at || s.updatedAt || s.scheduled_time) >= todayStart
  );

  // Unique patients for filter dropdown
  const uniquePatients = Array.from(
    new Map(
      schedules
        .filter(s => s.patient?.id)
        .map(s => [s.patient.id, `${s.patient.first_name} ${s.patient.last_name}`.trim()])
    ).entries()
  );

  // Get active list based on tab
  let currentTabList = [];
  switch (activeTab) {
    case 'overdue':
      currentTabList = overdueList;
      break;
    case 'due_soon':
      currentTabList = dueSoonList;
      break;
    case 'completed':
      currentTabList = completedTodayList;
      break;
    case 'all':
      currentTabList = schedules;
      break;
    case 'all_pending':
    default:
      currentTabList = allPendingList;
      break;
  }

  // Apply search & patient filter
  const filtered = currentTabList.filter(s => {
    if (selectedPatientFilter && String(s.patient_id) !== String(selectedPatientFilter)) {
      return false;
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const patientName = `${s.patient?.first_name || ''} ${s.patient?.last_name || ''}`.toLowerCase();
    const medName = (s.prescriptionItem?.medication_name || '').toLowerCase();
    const room = `room ${s.admission?.room?.room_number || ''}`.toLowerCase();
    return patientName.includes(q) || medName.includes(q) || room.includes(q);
  });

  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      {/* ── Top Stat Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        {/* Overdue Card */}
        <div
          onClick={() => setActiveTab('overdue')}
          className="id-card hover-card"
          style={{
            padding: '20px',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            cursor: 'pointer',
            borderColor: activeTab === 'overdue' ? '#ef4444' : '#e2e8f0',
            background: activeTab === 'overdue' ? '#fff5f5' : '#ffffff'
          }}
        >
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertTriangle size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Overdue Doses</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: overdueList.length > 0 ? '#dc2626' : '#0f172a', lineHeight: 1.2 }}>
              {overdueList.length}
            </div>
            <div style={{ fontSize: '0.78rem', color: overdueList.length > 0 ? '#ef4444' : '#94a3b8', marginTop: 2 }}>
              {overdueList.length > 0 ? 'Requires attention' : 'All doses on time'}
            </div>
          </div>
        </div>

        {/* Due Soon Card */}
        <div
          onClick={() => setActiveTab('due_soon')}
          className="id-card hover-card"
          style={{
            padding: '20px',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            cursor: 'pointer',
            borderColor: activeTab === 'due_soon' ? '#f59e0b' : '#e2e8f0',
            background: activeTab === 'due_soon' ? '#fffbeb' : '#ffffff'
          }}
        >
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#fef3c7',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Clock size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Due in Next Hour</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: dueSoonList.length > 0 ? '#d97706' : '#0f172a', lineHeight: 1.2 }}>
              {dueSoonList.length}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
              Upcoming medication round
            </div>
          </div>
        </div>

        {/* All Pending Card */}
        <div
          onClick={() => setActiveTab('all_pending')}
          className="id-card hover-card"
          style={{
            padding: '20px',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            cursor: 'pointer',
            borderColor: activeTab === 'all_pending' ? '#3b82f6' : '#e2e8f0',
            background: activeTab === 'all_pending' ? '#eff6ff' : '#ffffff'
          }}
        >
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#e0f2fe',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Pill size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Pending Doses</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
              {allPendingList.length}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
              Awaiting administration
            </div>
          </div>
        </div>

        {/* Completed Today Card */}
        <div
          onClick={() => setActiveTab('completed')}
          className="id-card hover-card"
          style={{
            padding: '20px',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            cursor: 'pointer',
            borderColor: activeTab === 'completed' ? '#10b981' : '#e2e8f0',
            background: activeTab === 'completed' ? '#f0fdf4' : '#ffffff'
          }}
        >
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#dcfce7',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CheckCircle size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Completed Today</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
              {completedTodayList.length}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
              Successfully administered
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Monitoring Card ── */}
      <div className="id-card">
        {/* Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Activity size={22} color="#0284c7" />
              Medication Schedule Monitoring
              <span style={{
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '3px 10px',
                borderRadius: 9999,
                fontSize: '0.78rem',
                fontWeight: 700
              }}>
                {filtered.length} {filtered.length === 1 ? 'Schedule' : 'Schedules'}
              </span>
            </h3>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
              Track scheduled administration times, overdue alerts, and delivery confirmations
            </p>
          </div>

          <button
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#475569',
              cursor: refreshing ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin-icon' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Tab Navigation Row */}
        <div className="id-tabs-row" style={{ marginBottom: 20 }}>
          {[
            { id: 'all_pending', label: `Pending (${allPendingList.length})` },
            { id: 'overdue', label: `Overdue (${overdueList.length})` },
            { id: 'due_soon', label: `Due Soon (${dueSoonList.length})` },
            { id: 'completed', label: `Completed Today (${completedTodayList.length})` },
            { id: 'all', label: `All Schedules (${schedules.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              className={`id-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter & Search Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 360 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search medication, patient, or room..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 38px 10px 40px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {uniquePatients.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Patient:</span>
              <select
                value={selectedPatientFilter}
                onChange={e => setSelectedPatientFilter(e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  fontSize: '0.88rem',
                  color: '#334155',
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: 220
                }}
              >
                <option value="">All Patients</option>
                {uniquePatients.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Schedules Table */}
        <div className="id-table-container">
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
              <div style={{ display: 'inline-block', width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 12 }}></div>
              <div>Loading medication schedules...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0' }}>
              <div style={{ width: 56, height: 56, background: '#f1f5f9', color: '#94a3b8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <CheckCircle size={28} />
              </div>
              <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: '#334155', fontWeight: 700 }}>
                {activeTab === 'overdue'
                  ? 'All Clear! No Overdue Medications'
                  : activeTab === 'due_soon'
                  ? 'No Medications Due in the Next Hour'
                  : 'No Medications Found'}
              </h4>
              <p style={{ color: '#64748b', margin: 0, fontSize: '0.88rem' }}>
                {search || selectedPatientFilter
                  ? 'No schedules matched your search and filter criteria.'
                  : 'All assigned patient medication doses are currently up to date.'}
              </p>
            </div>
          ) : (
            <table className="id-table">
              <thead>
                <tr>
                  <th>Scheduled Time</th>
                  <th>Patient</th>
                  <th>Medication</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const sDate = new Date(s.scheduled_time);
                  const isOverdue = s.status === 'pending' && sDate < now;
                  const isDueSoon = s.status === 'pending' && sDate >= now && sDate <= soonThreshold;
                  const isCompleted = s.status === 'completed';

                  return (
                    <tr key={s.id} style={{ transition: 'background-color 0.15s ease' }}>
                      {/* Scheduled Time */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={14} color={isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : '#64748b'} />
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                            {sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                          {sDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      </td>

                      {/* Patient */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                          {s.patient?.first_name} {s.patient?.last_name}
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                          <BedDouble size={12} />
                          Room {s.admission?.room?.room_number || 'N/A'}
                        </div>
                      </td>

                      {/* Medication */}
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {s.prescriptionItem?.medication_name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 1 }}>
                          Dosage: {s.prescriptionItem?.dosage}
                        </div>
                      </td>

                      {/* Route */}
                      <td>
                        <span style={{
                          background: '#e0f2fe',
                          color: '#0369a1',
                          padding: '2px 8px',
                          borderRadius: 9999,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}>
                          {s.prescriptionItem?.route?.replace('_', ' ') || 'ORAL'}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        {isOverdue ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: '#fee2e2',
                            color: '#dc2626',
                            padding: '3px 10px',
                            borderRadius: 9999,
                            fontSize: '0.78rem',
                            fontWeight: 700
                          }}>
                            <AlertTriangle size={12} /> Overdue
                          </span>
                        ) : isDueSoon ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: '#fef3c7',
                            color: '#d97706',
                            padding: '3px 10px',
                            borderRadius: 9999,
                            fontSize: '0.78rem',
                            fontWeight: 700
                          }}>
                            <Clock size={12} /> Due Soon
                          </span>
                        ) : isCompleted ? (
                          <span className="badge active" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={12} /> Completed
                          </span>
                        ) : (
                          <span className={`badge ${s.status === 'missed' ? 'inactive' : 'pending'}`} style={{ textTransform: 'capitalize' }}>
                            {s.status}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'right' }}>
                        {s.status === 'pending' ? (
                          <button
                            className="action-btn primary"
                            onClick={() => navigate('/nurse/scanner')}
                            style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            title="Scan wristband to administer"
                          >
                            <QrCode size={14} /> Scan
                          </button>
                        ) : isCompleted ? (
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {s.administeredBy ? `By ${s.administeredBy.last_name}` : 'Administered'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
