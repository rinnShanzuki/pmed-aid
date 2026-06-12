import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus, Pencil, Trash2, X, Users as UsersIcon } from 'lucide-react';

const ROLE_COLORS = {
  admin:     '#7c3aed',
  doctor:    '#16a34a',
  nurse:     '#ea580c',
  info_desk: '#0284c7',
  patient:   '#db2777',
};

const INITIAL_FORM = {
  first_name: '', last_name: '', email: '', password: '', role: 'doctor', is_active: true
};

export default function UserManagement() {
  const [users, setUsers]       = useState([]);
  const [search, setSearch]     = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | 'add' | 'edit'
  const [form, setForm]         = useState(INITIAL_FORM);
  const [editId, setEditId]     = useState(null);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  async function fetchUsers() {
    try {
      const params = { search };
      if (!showInactive) params.is_active = 'true';
      const { data } = await api.get('/users', { params });
      setUsers(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, [search, showInactive]);

  function openAdd() {
    setForm(INITIAL_FORM);
    setEditId(null);
    setError('');
    setModal('add');
  }

  function openEdit(user) {
    setForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: '',
      role: user.role,
      is_active: user.is_active,
    });
    setEditId(user.id);
    setError('');
    setModal('edit');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (modal === 'add') {
        await api.post('/users', form);
        setSuccess('User created successfully!');
      } else {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${editId}`, payload);
        setSuccess('User updated successfully!');
      }
      setModal(null);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed.');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      setSuccess('User deactivated.');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate user.');
    }
  }

  function getInitials(u) {
    return `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase();
  }

  return (
    <>
      {success && <div className="admin-alert admin-alert-success">{success}</div>}

      <div className="admin-table-card">
        <div className="table-header">
          <h3><UsersIcon size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />User Management</h3>
          <div className="table-header-actions">
            <div className="table-search">
              <Search />
              <input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#64748b', cursor: 'pointer' }}>
              <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
              Show Inactive
            </label>
            <button className="btn-add" onClick={openAdd}>
              <Plus size={16} /> Add User
            </button>
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: 32 }}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No users found</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-sm" style={{ background: ROLE_COLORS[u.role] || '#3b82f6' }}>
                        {getInitials(u)}
                      </div>
                      <div className="user-cell-info">
                        <span className="user-cell-name">{u.first_name} {u.last_name}</span>
                        <span className="user-cell-email">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge badge-${u.role}`}>{u.role?.replace('_', ' ')}</span></td>
                  <td><span className={`badge badge-${u.is_active ? 'active' : 'inactive'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{new Date(u.createdAt || u.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-action" title="Edit" onClick={() => openEdit(u)}><Pencil /></button>
                      <button className="btn-action btn-danger" title="Deactivate" onClick={() => handleDelete(u.id)}><Trash2 /></button>
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
              <h3>{modal === 'add' ? 'Add New User' : 'Edit User'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="admin-alert admin-alert-error">{error}</div>}
                <div className="modal-form">
                  <div className="modal-form-row">
                    <div className="modal-form-group">
                      <label>First Name</label>
                      <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
                    </div>
                    <div className="modal-form-group">
                      <label>Last Name</label>
                      <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
                    </div>
                  </div>
                  <div className="modal-form-group">
                    <label>Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className="modal-form-group">
                    <label>{modal === 'edit' ? 'New Password (leave blank to keep)' : 'Password'}</label>
                    <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} {...(modal === 'add' ? { required: true } : {})} />
                  </div>
                  <div className="modal-form-row">
                    <div className="modal-form-group">
                      <label>Role</label>
                      <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                        <option value="admin">Admin</option>
                        <option value="doctor">Doctor</option>
                        <option value="nurse">Nurse</option>
                        <option value="info_desk">Info Desk</option>
                        <option value="patient">Patient</option>
                      </select>
                    </div>
                    <div className="modal-form-group">
                      <label>Status</label>
                      <select value={form.is_active ? 'active' : 'inactive'} onChange={(e) => setForm({ ...form, is_active: e.target.value === 'active' })}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn-save">{modal === 'add' ? 'Create User' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
