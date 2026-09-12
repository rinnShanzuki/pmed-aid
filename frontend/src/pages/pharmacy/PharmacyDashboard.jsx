import { useState, useEffect, useCallback } from 'react';
import {
  Package, Search, AlertTriangle, CheckCircle2, Loader2,
  Plus, Minus, ArrowUpDown, Pill, ShoppingCart, BarChart3,
  X, ChevronDown, RefreshCw, TrendingDown, TrendingUp, Archive
} from 'lucide-react';
import api from '../../services/api';
import '../../styles/infoDesk.css';

/* ════════════════════════════════════════════════════════════
   Reusable tiny components
   ════════════════════════════════════════════════════════════ */
function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="id-card" style={{ padding: '20px 24px', flex: '1 1 200px', minWidth: 180 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{label}</label>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>{value}</div>
        </div>
      </div>
      {sub && <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>{sub}</p>}
    </div>
  );
}

function StatusBadge({ stock }) {
  if (stock === 0) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 700 }}>Out of Stock</span>;
  if (stock <= 10) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 700 }}>Low Stock</span>;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 700 }}>In Stock</span>;
}

/* ════════════════════════════════════════════════════════════
   Main Component
   ════════════════════════════════════════════════════════════ */
export default function PharmacyDashboard() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Inventory state
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState({ totalItems: 0, totalStock: 0, outOfStock: 0, lowStock: 0 });
  const [invSearch, setInvSearch] = useState('');
  const [invFilter, setInvFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  // Pending pickups state
  const [pickups, setPickups] = useState([]);
  const [pickupSearch, setPickupSearch] = useState('');

  // Modals
  const [dispenseModal, setDispenseModal] = useState(null); // { prescriptionItem, patientName }
  const [dispenseForm, setDispenseForm] = useState({ medication_id: '', quantity: 1 });
  const [restockModal, setRestockModal] = useState(null); // medication object
  const [restockQty, setRestockQty] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // ─── Fetchers ──
  const fetchInventory = useCallback(async () => {
    try {
      const res = await api.get('/pharmacy/inventory');
      setInventory(res.data.data.medications);
      setSummary(res.data.data.summary);
    } catch (err) { console.error('Inventory fetch error:', err); }
  }, []);

  const fetchPickups = useCallback(async () => {
    try {
      const res = await api.get('/pharmacy/pending-pickups');
      setPickups(res.data.data);
    } catch (err) { console.error('Pickups fetch error:', err); }
  }, []);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    await Promise.all([fetchInventory(), fetchPickups()]);
    setLoading(false);
    setRefreshing(false);
  }, [fetchInventory, fetchPickups]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => fetchAll(), 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // ─── Dispense handler ──
  async function handleDispense(e) {
    e.preventDefault();
    if (!dispenseModal) return;
    setActionLoading(true);
    try {
      await api.post('/pharmacy/dispense', {
        prescription_item_id: dispenseModal.itemId,
        medication_id: parseInt(dispenseForm.medication_id),
        quantity: parseInt(dispenseForm.quantity),
      });
      setDispenseModal(null);
      setDispenseForm({ medication_id: '', quantity: 1 });
      await fetchAll(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispense medication.');
    } finally {
      setActionLoading(false);
    }
  }

  // ─── Restock handler ──
  async function handleRestock(e) {
    e.preventDefault();
    if (!restockModal) return;
    setActionLoading(true);
    try {
      await api.post(`/pharmacy/restock/${restockModal.id}`, { quantity: parseInt(restockQty) });
      setRestockModal(null);
      setRestockQty('');
      await fetchAll(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restock medication.');
    } finally {
      setActionLoading(false);
    }
  }

  // ─── Sorting ──
  function handleSort(field) {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  // ─── Filtered & sorted inventory ──
  const filteredInventory = inventory
    .filter(m => {
      const matchSearch = invSearch === '' ||
        m.name.toLowerCase().includes(invSearch.toLowerCase()) ||
        (m.generic_name || '').toLowerCase().includes(invSearch.toLowerCase()) ||
        (m.category || '').toLowerCase().includes(invSearch.toLowerCase());
      const matchFilter = invFilter === 'all' ||
        (invFilter === 'in_stock' && m.stock > 10) ||
        (invFilter === 'low_stock' && m.stock > 0 && m.stock <= 10) ||
        (invFilter === 'out_of_stock' && (m.stock === 0 || m.status === 'out_of_stock'));
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      let valA = a[sortField], valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  // ─── Filtered pickups ──
  const filteredPickups = pickups.filter(p => {
    if (pickupSearch === '') return true;
    const q = pickupSearch.toLowerCase();
    const patientName = `${p.patient?.first_name} ${p.patient?.last_name}`.toLowerCase();
    const doctorName = `${p.doctor?.first_name} ${p.doctor?.last_name}`.toLowerCase();
    const itemNames = (p.items || []).map(i => i.medication_name.toLowerCase()).join(' ');
    return patientName.includes(q) || doctorName.includes(q) || itemNames.includes(q);
  });

  // ─── Loading ──
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#8b5cf6' }} />
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Loading pharmacy inventory…</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const SortIcon = ({ field }) => (
    <ArrowUpDown size={12} style={{ opacity: sortField === field ? 1 : 0.3, cursor: 'pointer' }} />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ═══════ HEADER ═══════ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Pharmacy Inventory</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Monitor stock levels and dispense medications to patients.</p>
        </div>
        <button
          className="action-btn outline"
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={16} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
          Refresh
        </button>
      </div>

      {/* ═══════ STAT CARDS ═══════ */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatCard icon={<Package size={22} color="#3b82f6" />} label="Total Items" value={summary.totalItems} sub="Unique medications in inventory" color="#3b82f6" />
        <StatCard icon={<BarChart3 size={22} color="#8b5cf6" />} label="Total Stock" value={summary.totalStock.toLocaleString()} sub="Combined units across all items" color="#8b5cf6" />
        <StatCard icon={<TrendingDown size={22} color="#f59e0b" />} label="Low Stock" value={summary.lowStock} sub="Items with ≤ 10 units remaining" color="#f59e0b" />
        <StatCard icon={<AlertTriangle size={22} color="#ef4444" />} label="Out of Stock" value={summary.outOfStock} sub="Items needing immediate restock" color="#ef4444" />
      </div>

      {/* ═══════ TABS ═══════ */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e2e8f0' }}>
        {[
          { key: 'inventory', label: 'Inventory Management', icon: <Archive size={16} /> },
          { key: 'pickups', label: 'Pending Pickups', icon: <ShoppingCart size={16} />, count: pickups.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 20px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.9rem', fontWeight: activeTab === tab.key ? 700 : 500,
              color: activeTab === tab.key ? '#8b5cf6' : '#64748b',
              borderBottom: activeTab === tab.key ? '3px solid #8b5cf6' : '3px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s',
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                background: '#8b5cf6', color: '#fff', borderRadius: 9999,
                padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700,
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: Inventory Management                                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'inventory' && (
        <div className="id-card">
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search medications…"
                value={invSearch}
                onChange={e => setInvSearch(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8,
                  border: '1px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box',
                }}
              />
            </div>
            <select
              value={invFilter}
              onChange={e => setInvFilter(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem', minWidth: 160 }}
            >
              <option value="all">All Stock Levels</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock (≤ 10)</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          {/* Table */}
          <div className="id-table-container">
            <table className="id-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>Medication Name <SortIcon field="name" /></div>
                  </th>
                  <th>Generic Name</th>
                  <th>Category</th>
                  <th onClick={() => handleSort('stock')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>Stock <SortIcon field="stock" /></div>
                  </th>
                  <th>Unit Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    <Package size={32} style={{ marginBottom: 8, opacity: 0.5 }} /><br />No medications match your search.
                  </td></tr>
                ) : filteredInventory.map(med => (
                  <tr key={med.id} style={med.stock === 0 ? { background: '#fef2f2' } : med.stock <= 10 ? { background: '#fffbeb' } : {}}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Pill size={16} color="#8b5cf6" />
                        {med.name}
                      </div>
                    </td>
                    <td style={{ color: '#64748b' }}>{med.generic_name || '—'}</td>
                    <td>
                      {med.category ? (
                        <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: 6, fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>{med.category}</span>
                      ) : '—'}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: med.stock === 0 ? '#dc2626' : med.stock <= 10 ? '#d97706' : '#0f172a' }}>
                        {med.stock.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ color: '#475569' }}>₱{parseFloat(med.unit_price || 0).toFixed(2)}</td>
                    <td><StatusBadge stock={med.stock} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="action-btn primary"
                        style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                        onClick={() => { setRestockModal(med); setRestockQty(''); }}
                      >
                        <TrendingUp size={14} />
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 2: Pending Pickups                                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'pickups' && (
        <div>
          {/* Search */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ position: 'relative', maxWidth: 400 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search patient, doctor, or medication…"
                value={pickupSearch}
                onChange={e => setPickupSearch(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8,
                  border: '1px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {filteredPickups.length === 0 ? (
            <div className="id-card" style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
              <CheckCircle2 size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
              <p style={{ fontSize: '1rem', margin: 0 }}>No pending prescriptions to dispense.</p>
            </div>
          ) : filteredPickups.map(rx => (
            <div key={rx.id} className="id-card" style={{ marginBottom: 16, borderLeft: `4px solid ${rx.type === 'discharge' ? '#f59e0b' : '#8b5cf6'}` }}>
              {/* Prescription Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>
                      {rx.patient?.first_name} {rx.patient?.last_name}
                    </span>
                    <span style={{
                      background: rx.type === 'discharge' ? '#fef3c7' : '#ede9fe',
                      color: rx.type === 'discharge' ? '#92400e' : '#6d28d9',
                      padding: '3px 10px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize',
                    }}>
                      {rx.type}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                    Prescribed by: Dr. {rx.doctor?.first_name} {rx.doctor?.last_name} · {new Date(rx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Rx #{rx.id}</span>
              </div>

              {/* Items table */}
              <div className="id-table-container">
                <table className="id-table">
                  <thead>
                    <tr>
                      <th>Medication</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Route</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rx.items || []).map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.medication_name}</td>
                        <td>{item.dosage}</td>
                        <td>{item.frequency}x {item.frequency_unit}</td>
                        <td>{item.duration}</td>
                        <td style={{ textTransform: 'capitalize' }}>{item.route}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="action-btn primary"
                            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                            onClick={() => {
                              setDispenseModal({
                                itemId: item.id,
                                medicationName: item.medication_name,
                                dosage: item.dosage,
                                patientName: `${rx.patient?.first_name} ${rx.patient?.last_name}`,
                              });
                              setDispenseForm({ medication_id: '', quantity: 1 });
                            }}
                          >
                            <Minus size={14} />
                            Dispense
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* DISPENSE MODAL                                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {dispenseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDispenseModal(null)}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Dispense Medication</h3>
              <button onClick={() => setDispenseModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                <strong style={{ color: '#0f172a' }}>Patient:</strong> {dispenseModal.patientName}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                <strong style={{ color: '#0f172a' }}>Prescribed:</strong> {dispenseModal.medicationName} ({dispenseModal.dosage})
              </p>
            </div>

            <form onSubmit={handleDispense}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 8 }}>Select Inventory Item *</label>
                <select
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  value={dispenseForm.medication_id}
                  onChange={e => setDispenseForm({ ...dispenseForm, medication_id: e.target.value })}
                  required
                >
                  <option value="">Select from inventory…</option>
                  {inventory.filter(m => m.stock > 0).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.generic_name ? `(${m.generic_name})` : ''} — Stock: {m.stock}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 8 }}>Quantity to Dispense *</label>
                <input
                  type="number"
                  min="1"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  value={dispenseForm.quantity}
                  onChange={e => setDispenseForm({ ...dispenseForm, quantity: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="action-btn outline" onClick={() => setDispenseModal(null)}>Cancel</button>
                <button type="submit" className="action-btn primary" disabled={actionLoading}>
                  {actionLoading ? 'Processing…' : 'Confirm Dispense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* RESTOCK MODAL                                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {restockModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setRestockModal(null)}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 400, padding: 24, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Restock Medication</h3>
              <button onClick={() => setRestockModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{restockModal.name}</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Current Stock: <strong style={{ color: restockModal.stock === 0 ? '#dc2626' : '#0f172a' }}>{restockModal.stock}</strong></p>
            </div>

            <form onSubmit={handleRestock}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 8 }}>Quantity to Add *</label>
                <input
                  type="number"
                  min="1"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  value={restockQty}
                  onChange={e => setRestockQty(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="action-btn outline" onClick={() => setRestockModal(null)}>Cancel</button>
                <button type="submit" className="action-btn primary" disabled={actionLoading}>
                  {actionLoading ? 'Restocking…' : 'Confirm Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
