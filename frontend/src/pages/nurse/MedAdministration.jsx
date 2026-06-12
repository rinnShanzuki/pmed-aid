import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Pill, CheckCircle, Clock, XCircle, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function MedAdministration() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, completed, missed
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, [filter]);

  async function fetchSchedules() {
    try {
      setLoading(true);
      const { data } = await api.get('/schedules', { params: { status: filter } });
      setSchedules(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminister(id) {
    if (!window.confirm('Mark this medication as administered?')) return;
    try {
      await api.post(`/schedules/${id}/administer`, { notes: 'Administered by nurse' });
      fetchSchedules();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to administer dose.');
    }
  }

  const filtered = schedules.filter(s => {
    if (!search) return true;
    const name = `${s.patient?.first_name} ${s.patient?.last_name}`.toLowerCase();
    const med = s.prescriptionItem?.medication_name?.toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || med?.includes(q);
  });

  return (
    <div className="id-card">
      <div className="id-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3><Pill size={20} /> Medication Administration</h3>
          <div className="search-bar" style={{ width: 250 }}>
            <Search size={16} />
            <input
              placeholder="Search patient or med..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={`btn-secondary ${filter === 'pending' ? 'active-filter' : ''}`} onClick={() => setFilter('pending')} style={filter === 'pending' ? { background: '#f8fafc', borderColor: '#cbd5e1' } : {}}>Pending</button>
          <button className={`btn-secondary ${filter === 'completed' ? 'active-filter' : ''}`} onClick={() => setFilter('completed')} style={filter === 'completed' ? { background: '#f8fafc', borderColor: '#cbd5e1' } : {}}>Completed</button>
          <button className={`btn-secondary ${filter === 'missed' ? 'active-filter' : ''}`} onClick={() => setFilter('missed')} style={filter === 'missed' ? { background: '#f8fafc', borderColor: '#cbd5e1' } : {}}>Missed</button>
        </div>
      </div>

      <div className="id-table-container">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading schedules...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No {filter} medications found.</div>
        ) : (
          <table className="id-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Patient</th>
                <th>Medication</th>
                <th>Route</th>
                <th>Status</th>
                {filter === 'pending' && <th style={{ textAlign: 'right' }}>Actions</th>}
                {filter === 'completed' && <th>Administered By</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} color="#64748b" />
                      {new Date(s.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(s.scheduled_time).toLocaleDateString()}</div>
                  </td>
                  <td><strong>{s.patient?.first_name} {s.patient?.last_name}</strong></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.prescriptionItem?.medication_name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{s.prescriptionItem?.dosage} {s.prescriptionItem?.dosage_unit}</div>
                  </td>
                  <td style={{ color: '#64748b' }}>{s.prescriptionItem?.route?.replace('_', ' ')}</td>
                  <td>
                    <span className={`badge ${s.status === 'completed' ? 'active' : s.status === 'missed' ? 'inactive' : 'pending'}`}>
                      {s.status}
                    </span>
                  </td>
                  {filter === 'pending' && (
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-primary" onClick={() => handleAdminister(s.id)} style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#ea580c' }}>
                        <CheckCircle size={14} style={{ marginRight: 4 }} /> Administer
                      </button>
                    </td>
                  )}
                  {filter === 'completed' && (
                    <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {s.administeredBy ? `${s.administeredBy.first_name} ${s.administeredBy.last_name}` : 'Unknown'}
                      <br/>
                      {s.administered_at && new Date(s.administered_at).toLocaleTimeString()}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
