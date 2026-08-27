import React, { useState, useEffect, useCallback } from 'react';
import {
  User, Plus, Edit, X,
  Eye, Save, Trash2, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Customer {
  id?: number;
  name: string;
  mobileNumber?: string;
  address?: string;
  startDate: string;
  productId?: number;
  productName?: string;
  productUnit?: string;
  quantity?: number;
  rate?: number;
  notes?: string;
  createdAt?: string;
}

interface Product {
  id: number;
  name: string;
  unit: string;
  defaultPrice: number;
}

interface EditState {
  name: string;
  startDate: string;
  notes: string;
  productId: number;
  quantity: number;
  rate: number;
}

// ── Subscription widget — defined OUTSIDE the parent component ──────────────
// (Defined here to avoid remount on every parent render)
interface SubscriptionProps {
  productId: number;
  quantity: number;
  rate: number;
  products: Product[];
  onProductChange: (id: number) => void;
  onQtyChange: (v: number) => void;
  onRateChange: (v: number) => void;
}

const SubscriptionWidget: React.FC<SubscriptionProps> = ({
  productId, quantity, rate, products, onProductChange, onQtyChange, onRateChange
}) => {
  const selectedProd = products.find(p => p.id === productId);

  return (
    <div style={{
      padding: '16px', borderRadius: '12px',
      backgroundColor: productId > 0 ? '#F0FDF4' : '#FAFAFA',
      border: `1px solid ${productId > 0 ? '#A7F3D0' : '#E5E7EB'}`,
      display: 'flex', flexDirection: 'column', gap: '12px'
    }}>
      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary-green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        📦 Subscription
      </div>

      {/* Product selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontWeight: 600, fontSize: '12px' }}>Product</label>
          <select
            className="form-input"
            value={productId}
            onChange={e => onProductChange(Number(e.target.value))}
            style={{ background: '#fff', fontWeight: 600 }}
          >
            <option value={0}>— Select product —</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.unit}) — ₹{p.defaultPrice}/{p.unit}</option>
            ))}
          </select>
        </div>

        {productId > 0 && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '12px' }}>
              Daily Qty ({selectedProd?.unit ?? 'unit'}/day)
            </label>
            <input
              type="number" step="0.1" min="0.1" className="form-input"
              value={quantity}
              onChange={e => onQtyChange(parseFloat(e.target.value) || 0)}
              style={{ background: '#fff', fontWeight: 700 }}
            />
          </div>
        )}

        {productId > 0 && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '12px' }}>
              Rate (₹/{selectedProd?.unit ?? 'unit'})
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, fontSize: '13px' }}>₹</span>
              <input
                type="number" step="0.5" min="0" className="form-input"
                value={rate}
                onChange={e => onRateChange(Number(e.target.value))}
                style={{ paddingLeft: '24px', background: '#fff', fontWeight: 700 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick preset buttons */}
      {productId > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--secondary-text)' }}>Quick Qty:</span>
          {[0.5, 1.0, 1.5, 2.0, 3.0].map(q => (
            <button
              key={q} type="button"
              onClick={() => onQtyChange(q)}
              style={{
                padding: '2px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                border: quantity === q ? '1px solid var(--primary-green)' : '1px solid var(--border-color)',
                backgroundColor: quantity === q ? 'var(--primary-green)' : '#fff',
                color: quantity === q ? '#fff' : 'var(--primary-text)'
              }}
            >{q}</button>
          ))}
        </div>
      )}

      {/* Live estimate */}
      {productId > 0 && quantity > 0 && rate > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ padding: '3px 10px', borderRadius: '20px', backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '11px', fontWeight: 700 }}>
            Daily: ₹{(quantity * rate).toFixed(2)}
          </span>
          <span style={{ padding: '3px 10px', borderRadius: '20px', backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '11px', fontWeight: 700 }}>
            Est. Monthly: ₹{(quantity * rate * 30).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
};

// ── Main Customers component ─────────────────────────────────────────────────

export const Customers: React.FC = () => {
  const { authFetch } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Panel states
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [expandedCustomerId, setExpandedCustomerId] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [configsLoading, setConfigsLoading] = useState(false);

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState<EditState>({
    name: '', startDate: '', notes: '', productId: 0, quantity: 1, rate: 0
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // New customer form
  const [newCust, setNewCust] = useState({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    productId: 0,
    quantity: 1.0,
    rate: 0,
    notes: ''
  });
  const [addError, setAddError] = useState<string | null>(null);

  // Delete
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/customers');
      if (res.ok) {
        setCustomers(await res.json());
      } else {
        setCustomers([]);
      }
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await authFetch('/products');
      if (res.ok) setProducts(await res.json());
    } catch { /* leave empty */ }
  }, [authFetch]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Add form helpers ─────────────────────────────────────────────────────────

  const resetAddForm = () => {
    setNewCust({
      name: '', startDate: new Date().toISOString().split('T')[0],
      productId: 0, quantity: 1.0, rate: 0, notes: ''
    });
    setAddError(null);
  };

  const handleNewProductChange = (prodId: number) => {
    const p = products.find(x => x.id === prodId);
    setNewCust(prev => ({ ...prev, productId: prodId, rate: p ? p.defaultPrice : 0 }));
  };

  // ── Save subscription config (reusable) ──────────────────────────────────────

  const saveConfig = async (customerId: number, productId: number, quantity: number, rate: number): Promise<boolean> => {
    try {
      const effectiveRate = rate > 0 ? rate : (products.find(p => p.id === productId)?.defaultPrice ?? 0);
      const res = await authFetch(`/customers/${customerId}/configs/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({
          productId,
          defaultQuantity: quantity,
          customPrice: effectiveRate,
          active: true
        })
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  // ── Add customer ─────────────────────────────────────────────────────────────

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const trimmedName = newCust.name.trim();
    if (!trimmedName) { setAddError('Customer name is required.'); return; }
    if (!newCust.startDate) { setAddError('Start date is required.'); return; }
    const dup = customers.some(c => c.name.trim().toLowerCase() === trimmedName.toLowerCase());
    if (dup) { setAddError(`⚠️ A customer named "${trimmedName}" already exists.`); return; }

    setSaving(true);
    try {
      const payload: any = {
        name: trimmedName,
        startDate: newCust.startDate,
        status: 'ACTIVE',
        notes: newCust.notes?.trim() || ''
      };
      if (newCust.productId > 0) {
        payload.productId = newCust.productId;
        payload.quantity = newCust.quantity;
        payload.rate = newCust.rate > 0 ? newCust.rate : (products.find(p => p.id === newCust.productId)?.defaultPrice ?? 0);
      }

      // 1. Create customer
      const res = await authFetch('/customers', { method: 'POST', body: JSON.stringify(payload) });
      if (!res.ok) {
        const errText = await res.text();
        setAddError(errText.includes('already exists') ? errText : '⚠️ Could not save customer. Please try again.');
        return;
      }

      const saved: Customer = await res.json();
      if (!saved.id) {
        setAddError('⚠️ Unexpected server response. Please refresh and try again.');
        return;
      }

      // 2. Save subscription config if product was selected
      if (newCust.productId > 0) {
        const configSaved = await saveConfig(saved.id, newCust.productId, newCust.quantity, newCust.rate);
        if (!configSaved) {
          // Customer saved but subscription failed — still proceed, show warning in edit form
          await fetchCustomers();
          setShowAddPanel(false);
          resetAddForm();
          // Auto-open in edit mode so user can retry subscription
          setExpandedCustomerId(saved.id);
          setSelectedCustomer(saved);
          setIsEditing(true);
          setEditState({
            name: saved.name,
            startDate: saved.startDate || newCust.startDate,
            notes: saved.notes || newCust.notes || '',
            productId: newCust.productId,
            quantity: newCust.quantity,
            rate: newCust.rate > 0 ? newCust.rate : (products.find(p => p.id === newCust.productId)?.defaultPrice ?? 0)
          });
          setUpdateError('⚠️ Customer saved but subscription could not be saved. Please use the Edit form below to save your subscription.');
          return;
        }
      }

      // 3. Refresh list and reset
      await fetchCustomers();
      setShowAddPanel(false);
      resetAddForm();
    } catch {
      setAddError('⚠️ Network error. Please check connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Detail panel open / close ─────────────────────────────────────────────────

  const openDetail = async (cust: Customer) => {
    if (expandedCustomerId === cust.id) {
      setExpandedCustomerId(null);
      setSelectedCustomer(null);
      setIsEditing(false);
      return;
    }

    setExpandedCustomerId(cust.id!);
    setSelectedCustomer(cust);
    setIsEditing(false);
    setUpdateSuccess(false);
    setUpdateError(null);

    // Set basic fields immediately
    setEditState({
      name: cust.name,
      startDate: cust.startDate,
      notes: cust.notes || '',
      productId: cust.productId ?? 0,
      quantity: cust.quantity ?? 1,
      rate: cust.rate ?? 0
    });

    // Then load precise configs from backend (more accurate than card summary)
    setConfigsLoading(true);
    try {
      const res = await authFetch(`/customers/${cust.id}/configs`);
      if (res.ok) {
        const configs: Array<{ productId: number; defaultQuantity: number; customPrice: number | null; active: boolean }> = await res.json();
        // Find the first product where a config with quantity > 0 exists
        const activeConfig = configs.find(cfg => cfg.defaultQuantity > 0);
        if (activeConfig) {
          const prod = products.find(p => p.id === activeConfig.productId);
          setEditState(prev => ({
            ...prev,
            productId: activeConfig.productId,
            quantity: activeConfig.defaultQuantity,
            rate: activeConfig.customPrice ?? prod?.defaultPrice ?? 0
          }));
        }
        // If no active config and customer has no subscription → auto-open edit mode
        if (!activeConfig && !cust.productName) {
          setIsEditing(true);
          setUpdateError('⚠️ This customer has no subscription yet. Select a product and save to set it up.');
        }
      }
    } catch { /* use card data as fallback */ }
    finally {
      setConfigsLoading(false);
    }
  };

  // ── Update customer + subscription ────────────────────────────────────────────

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(false);

    if (!editState.name.trim()) { setUpdateError('Name is required.'); return; }
    if (!editState.startDate) { setUpdateError('Start date is required.'); return; }

    const nameChanged = selectedCustomer?.name.trim().toLowerCase() !== editState.name.trim().toLowerCase();
    if (nameChanged) {
      const dup = customers.some(c => c.id !== selectedCustomer?.id && c.name.trim().toLowerCase() === editState.name.trim().toLowerCase());
      if (dup) { setUpdateError(`⚠️ Name "${editState.name.trim()}" is already taken.`); return; }
    }

    if (editState.productId > 0 && editState.quantity <= 0) {
      setUpdateError('Daily quantity must be greater than 0.'); return;
    }

    setSaving(true);
    try {
      // 1. Save customer details
      const detailRes = await authFetch(`/customers/${selectedCustomer?.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editState.name.trim(),
          startDate: editState.startDate,
          notes: editState.notes || '',
          mobileNumber: selectedCustomer?.mobileNumber || '',
          address: selectedCustomer?.address || ''
        })
      });

      if (!detailRes.ok) {
        const errText = await detailRes.text();
        setUpdateError(errText || '⚠️ Could not update customer details.');
        return;
      }

      // 2. Save subscription config if a product is selected
      if (editState.productId > 0 && editState.quantity > 0) {
        const effectiveRate = editState.rate > 0 ? editState.rate : (products.find(p => p.id === editState.productId)?.defaultPrice ?? 0);
        const configSaved = await saveConfig(selectedCustomer!.id!, editState.productId, editState.quantity, effectiveRate);
        if (!configSaved) {
          setUpdateError('⚠️ Details saved but subscription could not be saved. Please try again.');
          await fetchCustomers();
          return;
        }
      }

      // 3. Refresh and show success
      await fetchCustomers();
      setUpdateSuccess(true);
      setUpdateError(null);
      setIsEditing(false);
    } catch {
      setUpdateError('⚠️ Network error. Please check connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────

  const handleDeleteCustomer = async () => {
    if (!customerToDelete?.id) return;
    const id = customerToDelete.id;
    try {
      await authFetch(`/customers/${id}`, { method: 'DELETE' });
      setCustomers(prev => prev.filter(c => c.id !== id));
      if (expandedCustomerId === id) { setExpandedCustomerId(null); setSelectedCustomer(null); }
    } finally {
      setCustomerToDelete(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--primary-text)' }}>
          Customers ({customers.length})
        </h2>
        <button
          onClick={() => { setShowAddPanel(p => !p); setExpandedCustomerId(null); setSelectedCustomer(null); resetAddForm(); }}
          className="btn-primary"
          style={{ width: 'auto', display: 'flex', gap: '8px', padding: '10px 16px', borderRadius: '8px' }}
        >
          {showAddPanel ? <X size={18} /> : <Plus size={18} />}
          <span>{showAddPanel ? 'Close' : 'Add Customer'}</span>
        </button>
      </div>

      {/* ── Add Customer Panel ── */}
      {showAddPanel && (
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--primary-green)', backgroundColor: '#F0FDF4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} /> Add New Customer
            </h3>
            <button onClick={() => { setShowAddPanel(false); resetAddForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
          </div>

          {addError && (
            <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>
              {addError}
            </div>
          )}

          <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Name + Start Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Customer Name *</label>
                <input
                  type="text" className="form-input" required
                  value={newCust.name}
                  onChange={e => setNewCust(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Ramesh Patil"
                  style={{ background: '#fff' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Start Date *</label>
                <input
                  type="date" className="form-input" required
                  value={newCust.startDate}
                  onChange={e => setNewCust(p => ({ ...p, startDate: e.target.value }))}
                  style={{ background: '#fff' }}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Notes (optional)</label>
              <input
                type="text" className="form-input"
                value={newCust.notes}
                onChange={e => setNewCust(p => ({ ...p, notes: e.target.value }))}
                placeholder="Any notes about this customer..."
                style={{ background: '#fff' }}
              />
            </div>

            {/* Subscription */}
            <SubscriptionWidget
              productId={newCust.productId}
              quantity={newCust.quantity}
              rate={newCust.rate}
              products={products}
              onProductChange={handleNewProductChange}
              onQtyChange={v => setNewCust(p => ({ ...p, quantity: v }))}
              onRateChange={v => setNewCust(p => ({ ...p, rate: v }))}
            />

            <button
              type="submit" className="btn-primary" disabled={saving}
              style={{ padding: '12px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Customer'}
            </button>
          </form>
        </div>
      )}

      {/* ── Customer List ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading && customers.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--secondary-text)' }}>Loading...</div>
        ) : customers.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--secondary-text)' }}>
            No customers yet. Click <strong>Add Customer</strong> to create one!
          </div>
        ) : customers.map((c, index) => {
          const isExpanded = expandedCustomerId === c.id;

          return (
            <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

              {/* ── Card row ── */}
              <div
                className="card"
                onClick={() => openDetail(c)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 16px', cursor: 'pointer', transition: 'background 0.2s',
                  borderLeft: '4px solid var(--primary-green)',
                  backgroundColor: isExpanded ? '#F0FDF4' : '#fff'
                }}
              >
                {/* Left: info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                  <div style={{
                    minWidth: '34px', height: '34px', borderRadius: '50%',
                    backgroundColor: 'var(--light-green)', color: 'var(--primary-green)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '13px', flexShrink: 0
                  }}>#{index + 1}</div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--primary-text)' }}>{c.name}</h4>
                      <span style={{ fontSize: '11px', color: 'var(--primary-green)', backgroundColor: 'var(--light-green)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Since: {c.startDate}
                      </span>
                    </div>

                    {c.productName ? (
                      <div style={{ fontSize: '12px', color: 'var(--primary-text)', marginTop: '3px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📦 {c.productName}: {c.quantity ?? 1} {c.productUnit ?? ''}/day @ ₹{c.rate ?? 0}
                        <span style={{ color: '#065F46', backgroundColor: '#D1FAE5', padding: '1px 7px', borderRadius: '10px', fontSize: '11px' }}>
                          ₹{((c.quantity ?? 1) * (c.rate ?? 0) * 30).toFixed(0)}/mo
                        </span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#D97706', marginTop: '3px', fontWeight: 600 }}>
                        ⚠️ No subscription — click Details to set it up
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: buttons */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => openDetail(c)}
                    style={{
                      backgroundColor: isExpanded ? 'var(--primary-green)' : 'var(--light-green)',
                      color: isExpanded ? '#fff' : 'var(--primary-green)',
                      padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <Eye size={14} />
                    <span>{isExpanded ? 'Hide' : 'Details'}</span>
                  </button>

                  <button
                    onClick={() => setCustomerToDelete(c)}
                    style={{
                      backgroundColor: '#FEE2E2', color: '#991B1B',
                      padding: '7px 12px', borderRadius: '8px', border: '1px solid #FCA5A5',
                      cursor: 'pointer', fontWeight: 700, fontSize: '12px',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* ── Detail / Edit panel ── */}
              {isExpanded && (
                <div className="card" style={{ padding: '20px', backgroundColor: '#FAFAFA', borderLeft: '4px solid var(--primary-green)', marginLeft: '16px' }}>

                  {/* Panel header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--primary-green)' }}>
                      {isEditing ? `✏️ Edit — ${c.name}` : `📋 Details — ${c.name}`}
                    </h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!configsLoading && (
                        <button
                          onClick={() => { setIsEditing(p => !p); setUpdateSuccess(false); setUpdateError(null); }}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', gap: '4px', alignItems: 'center' }}
                        >
                          <Edit size={13} />
                          <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                        </button>
                      )}
                      <button onClick={() => { setExpandedCustomerId(null); setSelectedCustomer(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Configs loading spinner */}
                  {configsLoading && (
                    <div style={{ textAlign: 'center', padding: '16px', color: 'var(--secondary-text)', fontSize: '13px' }}>
                      Loading subscription data...
                    </div>
                  )}

                  {/* Success banner */}
                  {updateSuccess && (
                    <div style={{ backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} /> Customer & subscription saved successfully!
                    </div>
                  )}

                  {/* Error/warning banner */}
                  {updateError && (
                    <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>
                      {updateError}
                    </div>
                  )}

                  {!configsLoading && !isEditing ? (
                    /* ── Read-only view ── */
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                      <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--secondary-text)', fontWeight: 700 }}>NAME</span>
                        <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '4px' }}>{c.name}</div>
                      </div>
                      <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--secondary-text)', fontWeight: 700 }}>START DATE</span>
                        <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '4px' }}>📅 {c.startDate}</div>
                      </div>
                      <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: `1px solid ${c.productName ? 'var(--border-color)' : '#FCD34D'}` }}>
                        <span style={{ fontSize: '11px', color: 'var(--secondary-text)', fontWeight: 700 }}>SUBSCRIPTION</span>
                        <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>
                          {c.productName ? (
                            <>
                              📦 {c.productName}<br />
                              <span style={{ fontSize: '12px', fontWeight: 600 }}>{c.quantity ?? 1} {c.productUnit ?? ''}/day @ ₹{c.rate ?? 0}</span><br />
                              <span style={{ color: '#065F46', fontSize: '12px' }}>Est. ₹{((c.quantity ?? 1) * (c.rate ?? 0) * 30).toFixed(0)}/month</span>
                            </>
                          ) : (
                            <span style={{ color: '#D97706' }}>⚠️ Not set — click Edit to configure</span>
                          )}
                        </div>
                      </div>
                      {c.notes && (
                        <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', gridColumn: '1 / -1' }}>
                          <span style={{ fontSize: '11px', color: 'var(--secondary-text)', fontWeight: 700 }}>NOTES</span>
                          <div style={{ fontSize: '13px', marginTop: '4px' }}>📝 {c.notes}</div>
                        </div>
                      )}
                    </div>
                  ) : !configsLoading && isEditing ? (
                    /* ── Edit form ── */
                    <form onSubmit={handleUpdateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontWeight: 600 }}>Customer Name *</label>
                          <input
                            type="text" className="form-input" required
                            value={editState.name}
                            onChange={e => setEditState(p => ({ ...p, name: e.target.value }))}
                            style={{ background: '#fff' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontWeight: 600 }}>Start Date *</label>
                          <input
                            type="date" className="form-input" required
                            value={editState.startDate}
                            onChange={e => setEditState(p => ({ ...p, startDate: e.target.value }))}
                            style={{ background: '#fff' }}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontWeight: 600 }}>Notes</label>
                        <input
                          type="text" className="form-input"
                          value={editState.notes}
                          onChange={e => setEditState(p => ({ ...p, notes: e.target.value }))}
                          placeholder="Optional notes..."
                          style={{ background: '#fff' }}
                        />
                      </div>

                      {/* Subscription widget — product + qty + rate */}
                      <SubscriptionWidget
                        productId={editState.productId}
                        quantity={editState.quantity}
                        rate={editState.rate}
                        products={products}
                        onProductChange={id => {
                          const p = products.find(x => x.id === id);
                          setEditState(prev => ({ ...prev, productId: id, rate: p ? p.defaultPrice : prev.rate }));
                        }}
                        onQtyChange={v => setEditState(p => ({ ...p, quantity: v }))}
                        onRateChange={v => setEditState(p => ({ ...p, rate: v }))}
                      />

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="submit" className="btn-primary" disabled={saving}
                          style={{ padding: '10px 18px', display: 'flex', gap: '6px', alignItems: 'center', fontWeight: 700 }}
                        >
                          <Save size={15} />
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setIsEditing(false); setUpdateError(null); }}
                          className="btn-secondary"
                          style={{ padding: '10px 16px' }}
                        >Cancel</button>
                      </div>
                    </form>
                  ) : null}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {customerToDelete && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: '420px', padding: '24px', borderRadius: '16px',
            backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                <AlertTriangle size={22} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--primary-text)', margin: 0 }}>Delete Customer?</h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--secondary-text)', margin: 0, lineHeight: 1.6 }}>
              Permanently delete <strong>{customerToDelete.name}</strong>? This removes all their delivery, subscription, and billing records.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setCustomerToDelete(null)}
                style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >Cancel</button>
              <button
                onClick={handleDeleteCustomer}
                style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={14} /> Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
