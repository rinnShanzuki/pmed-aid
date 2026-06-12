import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Eye, X, Users } from 'lucide-react';

export default function PatientManagement() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function fetchPatients() {
      try {
        const { data } = await api.get('/patients', { params: { search } });
        setPatients(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  }, [search]);

  function getInitials(p) {
    return `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase();
  }

  return (
    <>
      <div className="admin-table-card">
        <div className="table-header">
          <h3><Users size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Patient Management</h3>
          <div className="table-header-actions">
            <div className="table-search">
              <Search />
              <input
                placeholder="Search patients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Gender</th>
              <th>Date of Birth</th>
              <th>Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: 32 }}>Loading...</td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No patients found</td></tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-sm" style={{ background: '#3b82f6' }}>
                        {getInitials(p)}
                      </div>
                      <div className="user-cell-info">
                        <span className="user-cell-name">{p.first_name} {p.last_name}</span>
                        <span className="user-cell-email">{p.user?.email || '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{p.gender || '—'}</td>
                  <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    {p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>{p.contact_number || '—'}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-action" title="View Details" onClick={() => setSelected(p)}>
                        <Eye />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Patient Detail Modal ── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>Patient Details</h3>
              <button className="modal-close" onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="patient-detail-header">
                <div className="patient-detail-avatar">{getInitials(selected)}</div>
                <div className="patient-detail-name">
                  <h2>{selected.first_name} {selected.last_name}</h2>
                  <p>{selected.user?.email || 'No linked account'}</p>
                </div>
              </div>
              <div className="patient-fields-grid">
                <div className="patient-field">
                  <label>Gender</label>
                  <span>{selected.gender || '—'}</span>
                </div>
                <div className="patient-field">
                  <label>Date of Birth</label>
                  <span>{selected.date_of_birth ? new Date(selected.date_of_birth).toLocaleDateString() : '—'}</span>
                </div>
                <div className="patient-field">
                  <label>Contact Number</label>
                  <span>{selected.contact_number || '—'}</span>
                </div>
                <div className="patient-field">
                  <label>Address</label>
                  <span>{selected.address || '—'}</span>
                </div>
                <div className="patient-field">
                  <label>Blood Type</label>
                  <span>{selected.blood_type || '—'}</span>
                </div>
                <div className="patient-field">
                  <label>Emergency Contact</label>
                  <span>{selected.emergency_contact || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
