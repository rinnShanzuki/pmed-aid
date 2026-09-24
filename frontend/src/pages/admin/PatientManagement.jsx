import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Search, Eye, Users } from 'lucide-react';

export default function PatientManagement() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  function getStatusBadge(type) {
    switch (type) {
      case 'admitted':
        return <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>Admitted</span>;
      case 'pending_admission':
        return <span style={{ background: '#dbeafe', color: '#2563eb', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>Pending Admission</span>;
      case 'outpatient':
        return <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>Outpatient</span>;
      default:
        return <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>None</span>;
    }
  }

  return (
    <>
      <div className="admin-table-card">
        <div className="table-header">
          <div></div>
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
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32 }}>Loading...</td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No patients found</td></tr>
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
                  <td>{getStatusBadge(p.patient_type)}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-action" title="View Details" onClick={() => navigate(`/admin/patients/${p.id}`)}>
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


    </>
  );
}
