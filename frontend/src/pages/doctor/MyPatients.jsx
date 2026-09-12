import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Search, Eye, User } from 'lucide-react';

export default function MyPatients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/patients', { params: { search } })
      .then(({ data }) => setPatients(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="id-card">
      <div className="doc-section-header">
        <h3><User size={18} /> My Patients</h3>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '10px 12px 10px 36px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', width: 240 }} />
        </div>
      </div>
      <div className="id-table-container">
        <table className="id-table">
          <thead><tr><th>Name</th><th>DOB</th><th>Gender</th><th>Contact</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: 32 }}>Loading...</td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No patients found.</td></tr>
            ) : patients.map(p => (
              <tr key={p.id}>
                <td><strong>{p.first_name} {p.last_name}</strong></td>
                <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : '—'}</td>
                <td style={{ textTransform: 'capitalize' }}>{p.gender || '—'}</td>
                <td>{p.contact_number || '—'}</td>
                <td>
                  <button className="action-btn outline" onClick={() => navigate(`/doctor/patients/${p.id}`)}>
                    <Eye size={14} /> View Record
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
