import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus, Pencil, Trash2, X, Pill } from 'lucide-react';

const INITIAL_FORM = {
  name: '', generic_name: '', category: '', stock: 0, status: 'active', description: ''
};

export default function MedicationManagement() {
  const [meds, setMeds]         = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState(INITIAL_FORM);
  const [editId, setEditId]     = useState(null);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  async function fetchMeds() {
    try {
      const { data } = await api.get('/medications');
      setMeds(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchMeds(); }, []);

  const filtered = meds.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.generic_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.category?.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setForm(INITIAL_FORM);
    setEditId(null);
    setError('');
    setModal('add');
  }

  function openEdit(med) {
    setForm({
      name: med.name,
      generic_name: med.generic_name || '',
      category: med.category || '',
      stock: med.stock,
      status: med.status,
      description: med.description || '',
    });
    setEditId(med.id);
    setError('');
    setModal('edit');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (modal === 'add') {
        await api.post('/medications', form);
        setSuccess('Medication added!');
      } else {
        await api.put(`/medications/${editId}`, form);
        setSuccess('Medication updated!');
      }
      setModal(null);
      fetchMeds();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed.');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to deactivate this medication?')) return;
    try {
      await api.delete(`/medications/${id}`);
      setSuccess('Medication deactivated.');
      fetchMeds();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed.');
    }
  }

  return (
    <>
      {success && <div className="admin-alert admin-alert-success">{success}</div>}

      <div className="admin-table-card">
        <div className="table-header">
          <h3><Pill size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Medication Catalog</h3>
          <div className="table-header-actions">
            <div className="table-search">
              <Search />
              <input
                placeholder="Search medications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="btn-add" onClick={openAdd}>
              <Plus size={16} /> Add Medication
            </button>
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Generic Name</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32 }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No medications found</td></tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600 }}>{m.name}</td>
                  <td style={{ color: '#64748b' }}>{m.generic_name || '—'}</td>
                  <td><span className="badge badge-info_desk">{m.category || 'General'}</span></td>
                  <td style={{ fontWeight: 600 }}>{m.stock}</td>
                  <td><span className={`badge badge-${m.status}`}>{m.status?.replace('_', ' ')}</span></td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-action" title="Edit" onClick={() => openEdit(m)}><Pencil /></button>
                      <button className="btn-action btn-danger" title="Deactivate" onClick={() => handleDelete(m.id)}><Trash2 /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal === 'add' ? 'Add Medication' : 'Edit Medication'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="admin-alert admin-alert-error">{error}</div>}
                <div className="modal-form">
                  <div className="modal-form-group">
                    <label>Brand Name</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="modal-form-row">
                    <div className="modal-form-group">
                      <label>Generic Name</label>
                      <input value={form.generic_name} onChange={(e) => setForm({ ...form, generic_name: e.target.value })} />
                    </div>
                    <div className="modal-form-group">
                      <label>Category</label>
                      <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Antibiotic" />
                    </div>
                  </div>
                  <div className="modal-form-row">
                    <div className="modal-form-group">
                      <label>Stock</label>
                      <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="modal-form-group">
                      <label>Status</label>
                      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="out_of_stock">Out of Stock</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-form-group">
                    <label>Description</label>
                    <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn-save">{modal === 'add' ? 'Add Medication' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
