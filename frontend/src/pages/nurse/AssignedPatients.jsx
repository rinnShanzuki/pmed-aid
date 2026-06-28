import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, BedDouble, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function AssignedPatients() {
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchAdmissions();
  }, [search, user]);

  async function fetchAdmissions() {
    try {
      setLoading(true);
      const { data } = await api.get('/admissions', { params: { status: 'admitted', search, assigned_nurse_id: user?.id } });
      setAdmissions(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="id-card">
      <div className="id-section-header">
        <h3><BedDouble size={20} /> Assigned Patients</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="search-bar" style={{ width: 300 }}>
            <Search size={16} />
            <input
              placeholder="Search by patient name or room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="id-table-container">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading patients...</div>
        ) : admissions.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No admitted patients found.</div>
        ) : (
          <table className="id-table">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Room Info</th>
                <th>Admission Date</th>
                <th>Attending Doctor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {admissions.map(adm => (
                <tr key={adm.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserIcon size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{adm.patient?.first_name} {adm.patient?.last_name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{adm.patient?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>Room {adm.room?.room_number || 'Unassigned'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{adm.room?.type?.replace('_', ' ')}</div>
                  </td>
                  <td style={{ color: '#64748b' }}>{new Date(adm.admission_date).toLocaleString()}</td>
                  <td>{adm.doctor ? `Dr. ${adm.doctor.last_name}` : 'Not assigned'}</td>
                  <td><span className="badge active">{adm.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
