import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Search,
  BedDouble,
  User as UserIcon,
  Users,
  Pill,
  QrCode,
  Clock,
  Stethoscope,
  X,
  RefreshCw,
  CheckCircle,
  Eye,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function AssignedPatients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [admissions, setAdmissions] = useState([]);
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Medication view modal state
  const [selectedPatientModal, setSelectedPatientModal] = useState(null);
  const [patientSchedules, setPatientSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  useEffect(() => {
    if (user?.id) fetchAdmissions();
  }, [user]);

  async function fetchAdmissions(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const { data } = await api.get('/admissions', {
        params: { status: 'admitted', assigned_nurse_id: user?.id }
      });
      setAdmissions(data.data || []);
    } catch (err) {
      console.error('Failed to fetch assigned admissions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function openPatientMeds(adm) {
    setSelectedPatientModal(adm);
    setLoadingSchedules(true);
    try {
      const res = await api.get(`/schedules/patient/${adm.patient_id}`);
      setPatientSchedules(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch patient schedules:', err);
      setPatientSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  }

  // Filter & Sort
  const filtered = admissions.filter(adm => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const patientName = `${adm.patient?.first_name || ''} ${adm.patient?.last_name || ''}`.toLowerCase();
    const room = `room ${adm.room?.room_number || ''}`.toLowerCase();
    const email = (adm.patient?.email || '').toLowerCase();
    const doctor = `${adm.doctor?.first_name || ''} ${adm.doctor?.last_name || ''}`.toLowerCase();
    return patientName.includes(q) || room.includes(q) || email.includes(q) || doctor.includes(q);
  });

  const sortedAndFiltered = [...filtered].sort((a, b) => {
    const nameA = `${a.patient?.first_name || ''} ${a.patient?.last_name || ''}`.toLowerCase();
    const nameB = `${b.patient?.first_name || ''} ${b.patient?.last_name || ''}`.toLowerCase();
    const roomA = a.room?.room_number || '';
    const roomB = b.room?.room_number || '';
    const dateA = new Date(a.admission_date || 0).getTime();
    const dateB = new Date(b.admission_date || 0).getTime();

    switch (sortOption) {
      case 'name-asc': return nameA.localeCompare(nameB);
      case 'name-desc': return nameB.localeCompare(nameA);
      case 'room': return String(roomA).localeCompare(String(roomB), undefined, { numeric: true });
      case 'oldest': return dateA - dateB;
      case 'recent':
      default:
        return dateB - dateA;
    }
  });

  // Overview stats
  const uniqueRooms = new Set(admissions.map(a => a.room?.room_number).filter(Boolean)).size;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const admittedTodayCount = admissions.filter(a => new Date(a.admission_date) >= todayStart).length;

  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      {/* ── Top Overview Metric Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        <div className="id-card" style={{ padding: '20px 24px', margin: 0, display: 'flex', alignItems: 'center', gap: 16 }}>
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
            <Users size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Assigned Patients</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{admissions.length}</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>In-hospital admitted</div>
          </div>
        </div>

        <div className="id-card" style={{ padding: '20px 24px', margin: 0, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#f0fdf4',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <BedDouble size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Active Rooms</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{uniqueRooms}</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>Occupied rooms assigned</div>
          </div>
        </div>

        <div className="id-card" style={{ padding: '20px 24px', margin: 0, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#faf5ff',
            color: '#9333ea',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Clock size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Admitted Today</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{admittedTodayCount}</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>New patient admissions</div>
          </div>
        </div>
      </div>

      {/* ── Main Patients Card ── */}
      <div className="id-card">
        {/* Card Header & Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Users size={22} color="#0284c7" />
              Patient Monitoring Roster
              <span style={{
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '3px 10px',
                borderRadius: 9999,
                fontSize: '0.78rem',
                fontWeight: 700
              }}>
                {filtered.length} {filtered.length === 1 ? 'Patient' : 'Patients'}
              </span>
            </h3>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
              Real-time clinical roster of admitted patients under your care
            </p>
          </div>

          <button
            onClick={() => fetchAdmissions(true)}
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

        {/* Toolbar: Search & Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 360 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search patient name, email, or room..."
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Sort:</span>
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: '#fff',
                fontSize: '0.88rem',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="recent">Newest Admission</option>
              <option value="oldest">Oldest Admission</option>
              <option value="name-asc">Patient Name (A - Z)</option>
              <option value="name-desc">Patient Name (Z - A)</option>
              <option value="room">Room Number</option>
            </select>
          </div>
        </div>

        {/* Patients Table */}
        <div className="id-table-container">
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
              <div style={{ display: 'inline-block', width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 12 }}></div>
              <div>Loading assigned patients...</div>
            </div>
          ) : sortedAndFiltered.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0' }}>
              <div style={{ width: 56, height: 56, background: '#f1f5f9', color: '#94a3b8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Users size={28} />
              </div>
              <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: '#334155', fontWeight: 700 }}>No Patients Found</h4>
              <p style={{ color: '#64748b', margin: 0, fontSize: '0.88rem' }}>
                {search ? 'No admitted patients matched your search criteria.' : 'There are currently no admitted patients assigned to you.'}
              </p>
            </div>
          ) : (
            <table className="id-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Room Info</th>
                  <th>Admission Date</th>
                  <th>Attending Doctor</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFiltered.map(adm => {
                  const patientName = `${adm.patient?.first_name || ''} ${adm.patient?.last_name || ''}`.trim() || 'Unnamed';
                  const initials = `${adm.patient?.first_name?.[0] || ''}${adm.patient?.last_name?.[0] || ''}`.toUpperCase() || 'P';
                  const admDate = adm.admission_date ? new Date(adm.admission_date) : null;

                  return (
                    <tr key={adm.id} style={{ transition: 'background-color 0.15s ease' }}>
                      {/* Patient Details */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                            color: '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                              {patientName}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                              {adm.patient?.contact_number || adm.patient?.email || `MRN-${String(adm.patient_id).padStart(5, '0')}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Room Info */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <BedDouble size={16} color="#64748b" />
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>
                            Room {adm.room?.room_number || 'Unassigned'}
                          </span>
                        </div>
                        {adm.room?.type && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize', marginTop: 2 }}>
                            {adm.room.type.replace('_', ' ')}
                          </div>
                        )}
                      </td>

                      {/* Admission Date */}
                      <td>
                        {admDate ? (
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' }}>
                              {admDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                              {admDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>N/A</span>
                        )}
                      </td>

                      {/* Attending Doctor */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Stethoscope size={15} color="#0284c7" />
                          <span style={{ fontWeight: 500, color: '#334155' }}>
                            {adm.doctor ? `Dr. ${adm.doctor.first_name || ''} ${adm.doctor.last_name || ''}`.trim() : 'Not assigned'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className="badge active" style={{ textTransform: 'capitalize' }}>
                          {adm.status || 'Admitted'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                          <button
                            className="action-btn outline"
                            onClick={() => openPatientMeds(adm)}
                            style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
                            title="View Patient Medication Plan"
                          >
                            <Pill size={14} /> View Meds
                          </button>
                          <button
                            className="action-btn primary"
                            onClick={() => navigate('/nurse/scanner')}
                            style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
                            title="Scan Patient Wristband"
                          >
                            <QrCode size={14} /> Scan
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Patient Medication Schedules Modal ── */}
      {selectedPatientModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16
          }}
          onClick={() => setSelectedPatientModal(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 620,
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>
                  {selectedPatientModal.patient?.first_name} {selectedPatientModal.patient?.last_name}
                </h3>
                <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 4 }}>
                  Room {selectedPatientModal.room?.room_number || 'N/A'} • Attending Dr. {selectedPatientModal.doctor?.last_name || 'Staff'}
                </div>
              </div>
              <button
                onClick={() => setSelectedPatientModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 6, borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Pill size={16} color="#0284c7" />
                  Prescribed Medication Schedules
                </h4>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                  {patientSchedules.length} Scheduled {patientSchedules.length === 1 ? 'Dose' : 'Doses'}
                </span>
              </div>

              {loadingSchedules ? (
                <div style={{ textAlign: 'center', padding: 36, color: '#64748b' }}>
                  Loading medication schedules...
                </div>
              ) : patientSchedules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0' }}>
                  <CheckCircle size={32} color="#10b981" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <div style={{ fontWeight: 600, color: '#334155' }}>No Medication Schedules</div>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0' }}>There are currently no active medication schedules for this patient.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {patientSchedules.map(s => {
                    const isCompleted = s.status === 'completed';
                    const isMissed = s.status === 'missed';
                    const isPending = s.status === 'pending';

                    return (
                      <div
                        key={s.id}
                        style={{
                          padding: '14px 16px',
                          borderRadius: 10,
                          border: '1px solid #e2e8f0',
                          background: isCompleted ? '#f0fdf4' : isMissed ? '#fef2f2' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                              {s.prescriptionItem?.medication_name}
                            </span>
                            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '1px 8px', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                              {s.prescriptionItem?.route?.replace('_', ' ')}
                            </span>
                          </div>
                          <div style={{ color: '#475569', fontSize: '0.85rem', marginTop: 3 }}>
                            <strong>Dosage:</strong> {s.prescriptionItem?.dosage}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                            <Clock size={13} />
                            {new Date(s.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{ marginTop: 4 }}>
                            <span className={`badge ${isCompleted ? 'active' : isMissed ? 'inactive' : 'pending'}`} style={{ textTransform: 'capitalize', fontSize: '0.75rem' }}>
                              {s.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                className="action-btn primary"
                onClick={() => {
                  setSelectedPatientModal(null);
                  navigate('/nurse/scanner');
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
              >
                <QrCode size={15} /> Go to Scanner
              </button>
              <button
                className="action-btn outline"
                onClick={() => setSelectedPatientModal(null)}
                style={{ fontSize: '0.85rem', background: '#fff' }}
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
