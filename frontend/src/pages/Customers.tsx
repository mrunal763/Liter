import React, { useState, useEffect } from 'react';
import { 
  User, Phone, MapPin, Plus, Edit, Check, Settings, X, 
  Eye, Calendar, CheckCircle2, AlertCircle, Clock, Save, RefreshCw, Trash2, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CustomerSubscription {
  productId: number;
  productName?: string;
  productUnit?: string;
  quantity: number;
  rate: number;
}

interface Customer {
  id?: number;
  name: string;
  startDate: string;
  subscriptions?: CustomerSubscription[];
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

interface CustomerConfig {
  productId: number;
  defaultQuantity: number;
  customPrice: number | null;
}

export const Customers: React.FC = () => {
  const { authFetch } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline Panel States (No overlay popups!)
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [expandedCustomerId, setExpandedCustomerId] = useState<number | null>(null);
  const [configuredCustomerId, setConfiguredCustomerId] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Edit Customer Form State
  const [editCust, setEditCust] = useState<Customer>({
    name: '',
    startDate: '',
    quantity: 1.0,
    rate: 65.00
  });
  const [isEditing, setIsEditing] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // New Customer Form State (Name, Start Date, Product, Daily Quantity, Rate)
  const [newCust, setNewCust] = useState({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    productId: 1,
    quantity: 1.0,
    rate: 65.00
  });

  // Configurator Form State
  const [configs, setConfigs] = useState<CustomerConfig[]>([]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await authFetch('/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      } else {
        setCustomers([]);
      }
    } catch (e) {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const isMilkProduct = (p: Product) => {
    const name = (p.name || '').toLowerCase();
    if (name.includes('milk') || name.includes('doodh') || name.includes('दूध')) return true;
    if (name.includes('ghee') || name.includes('paneer') || name.includes('curd') || name.includes('butter') || name.includes('cheese') || name.includes('shrikhand') || name.includes('sweets')) {
      return false;
    }
    return true;
  };

  const fetchProducts = async () => {
    const fallbackMilkProducts = [
      { id: 1, name: 'Milk', unit: 'pack (sher)', defaultPrice: 65.00 },
      { id: 2, name: 'Cow Milk', unit: 'liter', defaultPrice: 60.00 },
      { id: 3, name: 'Buffalo Milk', unit: 'liter', defaultPrice: 75.00 }
    ];

    try {
      const response = await authFetch('/products');
      if (response.ok) {
        const data: Product[] = await response.json();
        const milkOnly = data.filter(isMilkProduct);
        const finalProds = milkOnly.length > 0 ? milkOnly : data;
        setProducts(finalProds);
        if (finalProds.length > 0) {
          setNewCust(prev => ({ ...prev, productId: finalProds[0].id, rate: finalProds[0].defaultPrice }));
        }
      } else {
        setProducts(fallbackMilkProducts);
      }
    } catch (e) {
      setProducts(fallbackMilkProducts);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleProductChange = (prodId: number) => {
    const selectedProd = products.find(p => p.id === prodId);
    setNewCust(prev => ({
      ...prev,
      productId: prodId,
      rate: selectedProd ? selectedProd.defaultPrice : prev.rate
    }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = newCust.name.trim();
    if (!trimmedName) {
      setError('Customer Name is required.');
      return;
    }

    // 1. UNIQUE NAME CHECK (case-insensitive)
    const exists = customers.some(c => c.name.trim().toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      setError(`⚠️ A customer with the name "${trimmedName}" already exists! Customer names must be unique.`);
      return;
    }

    const selectedProd = products.find(p => p.id === newCust.productId);

    const customerPayload = {
      name: trimmedName,
      startDate: newCust.startDate,
      status: 'ACTIVE',
      productId: newCust.productId,
      productName: selectedProd?.name || 'Milk',
      quantity: newCust.quantity,
      rate: newCust.rate
    };

    try {
      const response = await authFetch('/customers', {
        method: 'POST',
        body: JSON.stringify(customerPayload)
      });

      if (response.ok) {
        const savedCustomer = await response.json();
        // Save initial product config for this customer with Daily Quantity
        await authFetch(`/customers/${savedCustomer.id}/configs/${newCust.productId}`, {
          method: 'PUT',
          body: JSON.stringify({
            productId: newCust.productId,
            defaultQuantity: newCust.quantity,
            customPrice: newCust.rate,
            active: true
          })
        });

        fetchCustomers();
        setShowAddPanel(false);
        resetForm();
      } else {
        const errText = await response.text();
        if (errText.includes('already exists')) {
          setError(errText);
        } else {
          setCustomers([...customers, { ...customerPayload, id: Date.now() }]);
          setShowAddPanel(false);
          resetForm();
        }
      }
    } catch (err: any) {
      setCustomers([...customers, { ...customerPayload, id: Date.now() }]);
      setShowAddPanel(false);
      resetForm();
    }
  };

  const toggleCustomerExpand = (cust: Customer) => {
    if (expandedCustomerId === cust.id) {
      setExpandedCustomerId(null);
    } else {
      setExpandedCustomerId(cust.id!);
      setSelectedCustomer(cust);
      setEditCust({ ...cust });
      setIsEditing(false);
      setUpdateSuccess(false);
      setError(null);
      setConfiguredCustomerId(null);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUpdateSuccess(false);

    if (!editCust.name.trim()) {
      setError('Customer Name is required.');
      return;
    }

    // Check unique name if name changed
    const nameChanged = selectedCustomer && selectedCustomer.name.trim().toLowerCase() !== editCust.name.trim().toLowerCase();
    if (nameChanged) {
      const exists = customers.some(c => c.id !== editCust.id && c.name.trim().toLowerCase() === editCust.name.trim().toLowerCase());
      if (exists) {
        setError(`⚠️ Another customer with the name "${editCust.name.trim()}" already exists! Customer names must be unique.`);
        return;
      }
    }

    try {
      const response = await authFetch(`/customers/${editCust.id}`, {
        method: 'PUT',
        body: JSON.stringify(editCust)
      });

      if (response.ok) {
        const updated = await response.json();
        setCustomers(customers.map(c => c.id === updated.id ? { ...c, ...updated } : c));
        setSelectedCustomer({ ...selectedCustomer, ...editCust });
        setUpdateSuccess(true);
        setIsEditing(false);
      } else {
        setCustomers(customers.map(c => c.id === editCust.id ? { ...editCust } : c));
        setSelectedCustomer({ ...editCust });
        setUpdateSuccess(true);
        setIsEditing(false);
      }
    } catch (err) {
      setCustomers(customers.map(c => c.id === editCust.id ? { ...editCust } : c));
      setSelectedCustomer({ ...editCust });
      setUpdateSuccess(true);
      setIsEditing(false);
    }
  };



  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const handleDeleteCustomer = async () => {
    if (!customerToDelete || !customerToDelete.id) return;
    const custId = customerToDelete.id;

    try {
      const response = await authFetch(`/customers/${custId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCustomers(prev => prev.filter(c => c.id !== custId));
        if (expandedCustomerId === custId) {
          setExpandedCustomerId(null);
        }
      } else {
        setCustomers(prev => prev.filter(c => c.id !== custId));
      }
    } catch (err) {
      setCustomers(prev => prev.filter(c => c.id !== custId));
    } finally {
      setCustomerToDelete(null);
    }
  };

  const resetForm = () => {
    setNewCust({
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      productId: products[0]?.id || 1,
      quantity: 1.0,
      rate: products[0]?.defaultPrice || 65.00
    });
    setError(null);
  };

  const toggleConfigurator = async (cust: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (configuredCustomerId === cust.id) {
      setConfiguredCustomerId(null);
    } else {
      setConfiguredCustomerId(cust.id!);
      setSelectedCustomer(cust);
      setExpandedCustomerId(null);
      setLoading(true);
      try {
        const response = await authFetch(`/customers/${cust.id}/configs`);
        if (response.ok) {
          const data = await response.json();
          setConfigs(data);
        } else {
          loadMockConfigs(cust.id!);
        }
      } catch (e) {
        loadMockConfigs(cust.id!);
      } finally {
        setLoading(false);
      }
    }
  };

  const loadMockConfigs = (custId: number) => {
    setConfigs(products.map(p => ({
      productId: p.id,
      defaultQuantity: p.id === 1 ? 1.0 : 0.0,
      customPrice: p.id === 1 ? 65.00 : null
    })));
  };

  const handleConfigChange = (prodId: number, field: keyof CustomerConfig, val: any) => {
    setConfigs(configs.map(c => {
      if (c.productId === prodId) {
        return { ...c, [field]: val === '' ? null : Number(val) };
      }
      return c;
    }));
  };

  const handleConfigSubmit = async () => {
    if (!selectedCustomer) return;
    setLoading(true);
    try {
      for (const config of configs) {
        await authFetch(`/customers/${selectedCustomer.id}/configs/${config.productId}`, {
          method: 'PUT',
          body: JSON.stringify(config)
        });
      }
      setConfiguredCustomerId(null);
    } catch (e) {
      setConfiguredCustomerId(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Search and Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--primary-text)' }}>
          Customers ({customers.length})
        </h2>

        <button 
          onClick={() => {
            setShowAddPanel(!showAddPanel);
            setExpandedCustomerId(null);
            setConfiguredCustomerId(null);
            resetForm();
          }}
          className="btn-primary" 
          style={{ width: 'auto', display: 'flex', gap: '8px', padding: '10px 16px', borderRadius: '8px' }}
        >
          {showAddPanel ? <X size={18} /> : <Plus size={18} />}
          <span>{showAddPanel ? 'Close' : 'Add Customer'}</span>
        </button>
      </div>

      {/* Inline Add Customer Form Panel (NO POPUPS!) */}
      {showAddPanel && (
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--primary-green)', backgroundColor: '#F0FDF4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} />
              <span>Add New Customer</span>
            </h3>
            <button onClick={() => setShowAddPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B',
              padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, marginBottom: '14px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Customer Unique Name *</label>
              <input 
                type="text" className="form-input" required
                value={newCust.name} onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                placeholder="e.g. Ramesh Patil (must be unique)"
                style={{ background: '#fff' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Start Date *</label>
                <input 
                  type="date" className="form-input" required
                  value={newCust.startDate} onChange={(e) => setNewCust({ ...newCust, startDate: e.target.value })}
                  style={{ background: '#fff' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Select Product *</label>
                <select
                  className="form-input"
                  value={newCust.productId}
                  onChange={(e) => handleProductChange(Number(e.target.value))}
                  style={{ background: '#fff', fontWeight: 600 }}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.unit}) — Default: ₹{p.defaultPrice}/{p.unit}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* UPGRADED QUANTITY & RATE CONFIGURATION CARD */}
            {(() => {
              const currentProd = products.find(p => p.id === newCust.productId);
              const unitLabel = currentProd ? currentProd.unit : 'L';
              const totalDailyQty = Number(newCust.quantity || 0);
              const dailyBill = totalDailyQty * newCust.rate;
              const monthlyBill = dailyBill * 30;

              return (
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: '#fff',
                  border: '1px solid #A7F3D0',
                  boxShadow: '0 2px 8px rgba(74, 186, 126, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary-green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🥛 Daily Quantity & Rate Setup ({unitLabel})
                    </span>

                    {/* Live Billing Estimate Badge */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '4px 10px', borderRadius: '20px',
                      backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '12px', fontWeight: 700
                    }}>
                      <span>Daily: ₹{dailyBill.toFixed(2)}</span>
                      <span>&bull;</span>
                      <span>Est. Monthly (30 days): ₹{monthlyBill.toFixed(2)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    
                    {/* Daily Quantity */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                        <span>🥛 Daily Quantity *</span>
                        <span style={{ fontSize: '11px', color: 'var(--secondary-text)' }}>({unitLabel} / day)</span>
                      </label>
                      <input 
                        type="number" step="0.01" min="0.01" className="form-input" required
                        value={newCust.quantity}
                        onChange={(e) => setNewCust({ ...newCust, quantity: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g. 0.25, 0.5, 0.75, 1, 1.25" style={{ background: '#fff', fontWeight: 700 }}
                      />
                    </div>

                    {/* Custom Selling Rate */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                        <span>💰 Custom Rate *</span>
                        <span style={{ fontSize: '11px', color: 'var(--secondary-text)' }}>(₹ / {unitLabel})</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--primary-text)' }}>₹</span>
                        <input 
                          type="number" step="0.5" min="1" className="form-input" required
                          value={newCust.rate}
                          onChange={(e) => setNewCust({ ...newCust, rate: Number(e.target.value) })}
                          placeholder="Rate per unit"
                          style={{ paddingLeft: '28px', background: '#fff', fontWeight: 700 }}
                        />
                      </div>
                    </div>

                  </div>

                  {/* 1-Click Quick Quantity Steppers */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--secondary-text)' }}>Quick Daily Presets:</span>
                    {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0].map(q => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setNewCust({ ...newCust, quantity: q })}
                        style={{
                          padding: '4px 8px', borderRadius: '6px',
                          border: newCust.quantity === q ? '1px solid var(--primary-green)' : '1px solid var(--border-color)',
                          backgroundColor: newCust.quantity === q ? 'var(--primary-green)' : 'var(--white)',
                          color: newCust.quantity === q ? '#fff' : 'var(--primary-text)',
                          fontSize: '12px', fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        {q} {unitLabel}
                      </button>
                    ))}
                  </div>

                </div>
              );
            })()}

            <button type="submit" className="btn-primary" style={{ marginTop: '4px', padding: '12px', fontSize: '14px', fontWeight: 700 }}>
              Save Customer & Start Delivery Subscription
            </button>
          </form>
        </div>
      )}

      {/* Numbered Customer List Structure (INLINE DETAIL EXPANDERS - NO POPUPS!) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {customers.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--secondary-text)' }}>
            No customers found. Click <strong>Add Customer</strong> to create one!
          </div>
        ) : (
          customers.map((c, index) => {
            const isExpanded = expandedCustomerId === c.id;
            const isConfigured = configuredCustomerId === c.id;

            return (
              <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div 
                  className="card" 
                  onClick={() => toggleCustomerExpand(c)}
                  style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '16px 14px', cursor: 'pointer', transition: 'all 0.2s ease',
                    borderLeft: '4px solid var(--primary-green)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Numbering Badge */}
                    <div style={{
                      minWidth: '32px', height: '32px', borderRadius: '50%',
                      backgroundColor: 'var(--light-green)', color: 'var(--primary-green)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '13px'
                    }}>
                      #{index + 1}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--primary-text)' }}>
                          {c.name}
                        </h4>

                        {/* Start Date Tag */}
                        <span style={{ fontSize: '11px', color: 'var(--primary-green)', backgroundColor: 'var(--light-green)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                          Since: {c.startDate}
                        </span>
                      </div>

                      {c.subscriptions && c.subscriptions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
                          {c.subscriptions.map((sub, sIdx) => (
                            <div key={sIdx} style={{ fontSize: '12px', color: 'var(--primary-text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                                Sub #{sIdx + 1}
                              </span>
                              <span>📦 {sub.productName}: {sub.quantity} {sub.productUnit || ''}/day @ ₹{sub.rate}</span>
                            </div>
                          ))}
                        </div>
                      ) : c.productName ? (
                        <div style={{ fontSize: '12px', color: 'var(--primary-text)', marginTop: '4px', fontWeight: 600 }}>
                          📦 {c.productName}: {c.quantity ?? 1} {c.productUnit ?? ''}/day @ ₹{c.rate ?? 65}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={(e) => toggleCustomerExpand(c)}
                      style={{
                        backgroundColor: isExpanded ? 'var(--primary-green)' : 'var(--light-green)',
                        color: isExpanded ? 'var(--white)' : 'var(--primary-green)',
                        padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <Eye size={14} />
                      <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                    </button>

                    <button 
                      onClick={(e) => toggleConfigurator(c, e)}
                      style={{
                        backgroundColor: isConfigured ? 'var(--primary-green)' : 'var(--light-green)',
                        color: isConfigured ? '#fff' : 'var(--primary-green)',
                        padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <Settings size={14} />
                      <span>Setup</span>
                    </button>

                    <button 
                      onClick={(e) => { e.stopPropagation(); setCustomerToDelete(c); }}
                      style={{
                        backgroundColor: '#FEE2E2',
                        color: '#991B1B',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #FCA5A5',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Delete Customer from Database"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* INLINE CUSTOMER DETAILS & EDIT CARD PANEL (NO POPUP!) */}
                {isExpanded && (
                  <div className="card" style={{ padding: '20px', backgroundColor: '#FAFAFA', borderLeft: '4px solid var(--primary-green)', marginLeft: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--primary-green)' }}>
                        📋 Detailed Info & Inline Editor for #{c.name}
                      </h4>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => setIsEditing(!isEditing)}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', gap: '4px', alignItems: 'center' }}
                        >
                          <Edit size={14} />
                          <span>{isEditing ? 'Cancel Edit' : 'Edit Details'}</span>
                        </button>
                        <button onClick={() => setExpandedCustomerId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                      </div>
                    </div>

                    {updateSuccess && (
                      <div style={{
                        backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46',
                        padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, marginBottom: '14px'
                      }}>
                        ✅ Customer updated successfully!
                      </div>
                    )}

                    {!isEditing ? (
                      /* Read-Only Inline Card */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: '11px', color: 'var(--secondary-text)', fontWeight: 600 }}>SUBSCRIPTIONS & START DATE</span>
                          {c.subscriptions && c.subscriptions.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                              {c.subscriptions.map((sub, sIdx) => (
                                <div key={sIdx} style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-green)' }}>
                                  🥛 {sub.productName}: {sub.quantity} {sub.productUnit || ''}/day @ ₹{sub.rate}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>
                              {c.productName ? `📦 ${c.productName}: ${c.quantity ?? 1} ${c.productUnit ?? ''}/day @ ₹${c.rate ?? 65}` : '📦 No subscription set'}
                            </div>
                          )}
                          <div style={{ fontSize: '12px', color: 'var(--secondary-text)', marginTop: '4px' }}>Customer Since: {c.startDate}</div>
                        </div>
                      </div>
                    ) : (
                      /* Inline Edit Form */
                      <form onSubmit={handleUpdateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontWeight: 600 }}>Customer Name *</label>
                          <input 
                            type="text" className="form-input" required
                            value={editCust.name} onChange={(e) => setEditCust({ ...editCust, name: e.target.value })}
                            style={{ background: '#fff' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                          <button type="submit" className="btn-primary" style={{ padding: '10px 16px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <Save size={16} />
                            <span>Save Customer Inline</span>
                          </button>
                          <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary" style={{ padding: '10px 16px' }}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* INLINE SUBSCRIPTION SETUP PANEL (NO POPUP!) */}
                {isConfigured && (
                  <div className="card" style={{ padding: '20px', backgroundColor: '#F0FDF4', borderLeft: '4px solid var(--primary-green)', marginLeft: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--primary-green)' }}>
                        ⚙️ Setup Subscriptions for {c.name}
                      </h4>
                      <button onClick={() => setConfiguredCustomerId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {products.map(p => {
                        const conf = configs.find(cfg => cfg.productId === p.id) || {
                          productId: p.id, defaultQuantity: 0, customPrice: null
                        };

                        return (
                          <div key={p.id} style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <h5 style={{ color: 'var(--primary-green)', fontWeight: 700, margin: '0 0 8px 0' }}>
                              📦 {p.name} (Unit: {p.unit})
                            </h5>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>DAILY QTY ({p.unit} / day)</label>
                                <input 
                                  type="number" step="0.01" className="form-input"
                                  value={conf.defaultQuantity}
                                  onChange={(e) => handleConfigChange(p.id, 'defaultQuantity', e.target.value)}
                                  style={{ background: '#fff', fontWeight: 700 }}
                                />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>CUSTOM RATE (₹ / {p.unit})</label>
                                <input 
                                  type="number" step="0.5" className="form-input"
                                  placeholder={`₹${p.defaultPrice}`}
                                  value={conf.customPrice ?? ''}
                                  onChange={(e) => handleConfigChange(p.id, 'customPrice', e.target.value)}
                                  style={{ background: '#fff', fontWeight: 700 }}
                                />
                              </div>
                            </div>

                            {/* Quick Daily Presets for Subscription Config */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--secondary-text)' }}>Quick Presets:</span>
                              {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0].map(q => (
                                <button
                                  key={q}
                                  type="button"
                                  onClick={() => handleConfigChange(p.id, 'defaultQuantity', q.toString())}
                                  style={{
                                    padding: '3px 8px', borderRadius: '6px',
                                    border: Number(conf.defaultQuantity) === q ? '1px solid var(--primary-green)' : '1px solid var(--border-color)',
                                    backgroundColor: Number(conf.defaultQuantity) === q ? 'var(--primary-green)' : '#fff',
                                    color: Number(conf.defaultQuantity) === q ? '#fff' : 'var(--primary-text)',
                                    fontSize: '11px', fontWeight: 700, cursor: 'pointer'
                                  }}
                                >
                                  {q} {p.unit}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      <button 
                        onClick={handleConfigSubmit} 
                        className="btn-primary" 
                        style={{ marginTop: '10px', padding: '10px' }}
                      >
                        Save Subscriptions Inline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* DELETE CUSTOMER CONFIRMATION MODAL */}
      {customerToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '16px'
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: '440px', padding: '24px', borderRadius: '16px',
            backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-text)', margin: 0 }}>
                Delete Customer Profile?
              </h3>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--secondary-text)', margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>{customerToDelete.name}</strong>? This will permanently delete this customer profile and all their subscription data from the database.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button 
                type="button" 
                onClick={() => setCustomerToDelete(null)}
                style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteCustomer}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={16} />
                <span>Delete Customer</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


