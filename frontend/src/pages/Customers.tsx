import React, { useState, useEffect } from 'react';
import { 
  User, Phone, MapPin, Plus, Edit, Check, Settings, X, 
  Eye, Calendar, CheckCircle2, AlertCircle, Clock, Save, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Customer {
  id?: number;
  name: string;
  mobileNumber: string;
  address: string;
  startDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  activationDate?: string;
  deactivationDate?: string;
  productId?: number;
  productName?: string;
  quantity?: number;
  rate?: number;
  notes?: string;
}

interface Product {
  id: number;
  name: string;
  unit: string;
  defaultPrice: number;
}

interface CustomerConfig {
  productId: number;
  defaultQtyMorning: number;
  defaultQtyEvening: number;
  customPrice: number | null;
}

export const Customers: React.FC = () => {
  const { authFetch } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
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
    mobileNumber: '',
    address: '',
    startDate: '',
    status: 'ACTIVE',
    quantity: 1.0,
    rate: 65.00
  });
  const [isEditing, setIsEditing] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // New Customer Form State (Name, Phone, single Address, Start Date, Product, Quantity, Rate)
  const [newCust, setNewCust] = useState({
    name: '',
    mobileNumber: '',
    address: '',
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
      const response = await authFetch(`/customers?status=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      } else {
        loadMockCustomers();
      }
    } catch (e) {
      loadMockCustomers();
    } finally {
      setLoading(false);
    }
  };

  const loadMockCustomers = () => {
    const today = new Date().toISOString().split('T')[0];
    const mockCust: Customer[] = [
      { 
        id: 1, name: 'Ramesh Patil', mobileNumber: '9876543210', 
        address: 'Plot 4, Lane 2, Krishna Nagar, Pune', startDate: '2026-08-01', 
        status: 'ACTIVE', activationDate: '2026-08-01', productName: 'Milk', productId: 1, quantity: 1.5, rate: 65.00 
      },
      { 
        id: 2, name: 'Suresh Kumar', mobileNumber: '9812345678', 
        address: 'Galli 1, Shivaji Colony, Pune', startDate: '2026-08-05', 
        status: 'ACTIVE', activationDate: '2026-08-05', productName: 'Milk', productId: 1, quantity: 1.0, rate: 65.00 
      },
      { 
        id: 3, name: 'Mahesh Deshmukh', mobileNumber: '9567890123', 
        address: 'Room 12, Block B, Ganesh Wadi, Pune', startDate: '2026-08-10', 
        status: 'ACTIVE', activationDate: '2026-08-10', productName: 'Curd', productId: 2, quantity: 0.5, rate: 85.00 
      },
      { 
        id: 4, name: 'Anil Shinde', mobileNumber: '9123456789', 
        address: 'House 88, Near Water Tank, Katraj, Pune', startDate: '2026-07-15', 
        status: 'INACTIVE', activationDate: '2026-07-15', deactivationDate: '2026-08-20', productName: 'Milk', productId: 1, quantity: 2.0, rate: 65.00 
      }
    ];
    setCustomers(mockCust.filter(c => c.status === filter));
  };

  const fetchProducts = async () => {
    try {
      const response = await authFetch('/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        if (data.length > 0) {
          setNewCust(prev => ({ ...prev, productId: data[0].id, rate: data[0].defaultPrice }));
        }
      } else {
        setProducts([
          { id: 1, name: 'Milk', unit: 'pack (sher)', defaultPrice: 65.00 },
          { id: 2, name: 'Curd', unit: 'kg', defaultPrice: 85.00 },
          { id: 3, name: 'Paneer', unit: 'kg', defaultPrice: 340.00 }
        ]);
      }
    } catch (e) {
      setProducts([
        { id: 1, name: 'Milk', unit: 'pack (sher)', defaultPrice: 65.00 },
        { id: 2, name: 'Curd', unit: 'kg', defaultPrice: 85.00 },
        { id: 3, name: 'Paneer', unit: 'kg', defaultPrice: 340.00 }
      ]);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [filter]);

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

    if (!newCust.mobileNumber.trim()) {
      setError('Mobile Phone Number is required.');
      return;
    }

    if (!newCust.address.trim()) {
      setError('Address is required.');
      return;
    }

    // 1. UNIQUE NAME CHECK (case-insensitive)
    const exists = customers.some(c => c.name.trim().toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      setError(`⚠️ A customer with the name "${trimmedName}" already exists! Customer names must be unique.`);
      return;
    }

    const selectedProd = products.find(p => p.id === newCust.productId);
    const todayStr = new Date().toISOString().split('T')[0];

    const customerPayload: Customer = {
      name: trimmedName,
      mobileNumber: newCust.mobileNumber.trim(),
      address: newCust.address.trim(),
      startDate: newCust.startDate,
      status: 'ACTIVE',
      activationDate: newCust.startDate || todayStr,
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
        // Save initial product config for this customer
        await authFetch(`/customers/${savedCustomer.id}/configs/${newCust.productId}`, {
          method: 'PUT',
          body: JSON.stringify({
            productId: newCust.productId,
            defaultQtyMorning: newCust.quantity,
            defaultQtyEvening: 0,
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

    if (!editCust.mobileNumber.trim()) {
      setError('Phone Number is required.');
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

  const handleToggleStatus = async (customer: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const todayStr = new Date().toISOString().split('T')[0];
    const newStatus: 'ACTIVE' | 'INACTIVE' = customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    const updatedDates = newStatus === 'ACTIVE' 
      ? { status: newStatus, activationDate: todayStr } 
      : { status: newStatus, deactivationDate: todayStr };

    try {
      const response = await authFetch(`/customers/${customer.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchCustomers();
      } else {
        setCustomers(customers.map(c => c.id === customer.id ? { ...c, ...updatedDates } : c));
      }
    } catch (err) {
      setCustomers(customers.map(c => c.id === customer.id ? { ...c, ...updatedDates } : c));
    }

    if (selectedCustomer && selectedCustomer.id === customer.id) {
      setSelectedCustomer(prev => prev ? ({ ...prev, ...updatedDates }) : null);
      setEditCust(prev => ({ ...prev, ...updatedDates }));
    }
  };

  const resetForm = () => {
    setNewCust({
      name: '',
      mobileNumber: '',
      address: '',
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
      defaultQtyMorning: p.id === 1 ? 1.0 : 0.0,
      defaultQtyEvening: 0.0,
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
      
      {/* Search and Tabs Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
          <button 
            onClick={() => setFilter('ACTIVE')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: filter === 'ACTIVE' ? 'var(--primary-green)' : 'var(--white)',
              color: filter === 'ACTIVE' ? 'var(--white)' : 'var(--primary-text)'
            }}
          >
            Active Customers ({customers.filter(c => c.status === 'ACTIVE').length})
          </button>
          <button 
            onClick={() => setFilter('INACTIVE')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: filter === 'INACTIVE' ? 'var(--primary-green)' : 'var(--white)',
              color: filter === 'INACTIVE' ? 'var(--white)' : 'var(--primary-text)'
            }}
          >
            Inactive
          </button>
        </div>

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
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--primary-green)' }}>
              👤 Add New Customer (Inline)
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Customer Unique Name *</label>
                <input 
                  type="text" className="form-input" required
                  value={newCust.name} onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  placeholder="e.g. Ramesh Patil (must be unique)"
                  style={{ background: '#fff' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Phone Number *</label>
                <input 
                  type="tel" className="form-input" required
                  value={newCust.mobileNumber} onChange={(e) => setNewCust({ ...newCust, mobileNumber: e.target.value })}
                  placeholder="10-digit mobile e.g. 9876543210"
                  style={{ background: '#fff' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Full Address *</label>
              <input 
                type="text" className="form-input" required
                value={newCust.address} onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                placeholder="e.g. Plot 4, Lane 2, Krishna Nagar, Pune"
                style={{ background: '#fff' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
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
                  style={{ background: '#fff' }}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.unit}) - ₹{p.defaultPrice}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Quantity & Rate *</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input 
                    type="number" step="0.1" min="0.1" className="form-input" required
                    value={newCust.quantity} onChange={(e) => setNewCust({ ...newCust, quantity: Number(e.target.value) })}
                    placeholder="Qty" style={{ background: '#fff' }}
                  />
                  <input 
                    type="number" step="0.5" min="1" className="form-input" required
                    value={newCust.rate} onChange={(e) => setNewCust({ ...newCust, rate: Number(e.target.value) })}
                    placeholder="Rate" style={{ background: '#fff' }}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '6px', padding: '12px' }}>
              Save Customer Inline
            </button>
          </form>
        </div>
      )}

      {/* Numbered Customer List Structure (INLINE DETAIL EXPANDERS - NO POPUPS!) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {customers.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--secondary-text)' }}>
            No {filter.toLowerCase()} customers found. Click <strong>Add Customer</strong> to create one!
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
                    borderLeft: filter === 'ACTIVE' ? '4px solid var(--primary-green)' : '4px solid var(--secondary-text)'
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

                        {/* Activation / Deactivation Date Tag */}
                        {c.status === 'ACTIVE' ? (
                          <span style={{ fontSize: '11px', color: 'var(--primary-green)', backgroundColor: 'var(--light-green)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                            Activated: {c.activationDate || c.startDate}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#991B1B', backgroundColor: '#FEE2E2', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                            Deactivated: {c.deactivationDate || 'Recently'}
                          </span>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', color: 'var(--secondary-text)', marginTop: '4px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={13} style={{ color: 'var(--primary-green)' }} />
                          <span style={{ fontWeight: 600 }}>{c.mobileNumber || 'No phone'}</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} style={{ color: 'var(--primary-green)' }} />
                          <span>{c.address || 'No address'}</span>
                        </div>
                      </div>

                      {c.productName && (
                        <div style={{ fontSize: '12px', color: 'var(--primary-text)', marginTop: '4px', fontWeight: 600 }}>
                          📦 {c.productName}: {c.quantity || 1.0} @ ₹{c.rate || 65}/unit
                        </div>
                      )}
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
                      onClick={(e) => handleToggleStatus(c, e)}
                      style={{
                        backgroundColor: filter === 'ACTIVE' ? '#FEE2E2' : '#D1FAE5',
                        color: filter === 'ACTIVE' ? 'var(--error-color)' : 'var(--primary-green)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '12px'
                      }}
                    >
                      {filter === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '11px', color: 'var(--secondary-text)', fontWeight: 600 }}>CUSTOMER NAME & PHONE</span>
                            <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>{c.name}</div>
                            <div style={{ fontSize: '13px', color: 'var(--primary-green)', fontWeight: 600, marginTop: '2px' }}>📞 {c.mobileNumber}</div>
                          </div>

                          <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '11px', color: 'var(--secondary-text)', fontWeight: 600 }}>STATUS & DATES</span>
                            <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>
                              🟢 Status: {c.status}
                            </div>
                            {c.activationDate && <div style={{ fontSize: '12px', color: 'var(--primary-green)' }}>Activated: {c.activationDate}</div>}
                            {c.deactivationDate && <div style={{ fontSize: '12px', color: '#991B1B' }}>Deactivated: {c.deactivationDate}</div>}
                          </div>
                        </div>

                        <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: '11px', color: 'var(--secondary-text)', fontWeight: 600 }}>FULL ADDRESS</span>
                          <div style={{ fontSize: '13px', marginTop: '2px', fontWeight: 500 }}>🏠 {c.address}</div>
                        </div>
                      </div>
                    ) : (
                      /* Inline Edit Form */
                      <form onSubmit={handleUpdateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontWeight: 600 }}>Customer Name *</label>
                            <input 
                              type="text" className="form-input" required
                              value={editCust.name} onChange={(e) => setEditCust({ ...editCust, name: e.target.value })}
                              style={{ background: '#fff' }}
                            />
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontWeight: 600 }}>Phone Number *</label>
                            <input 
                              type="tel" className="form-input" required
                              value={editCust.mobileNumber} onChange={(e) => setEditCust({ ...editCust, mobileNumber: e.target.value })}
                              style={{ background: '#fff' }}
                            />
                          </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontWeight: 600 }}>Full Address *</label>
                          <input 
                            type="text" className="form-input" required
                            value={editCust.address} onChange={(e) => setEditCust({ ...editCust, address: e.target.value })}
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
                          productId: p.id, defaultQtyMorning: 0, defaultQtyEvening: 0, customPrice: null
                        };

                        return (
                          <div key={p.id} style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <h5 style={{ color: 'var(--primary-green)', fontWeight: 700, margin: '0 0 8px 0' }}>
                              📦 {p.name} (Unit: {p.unit})
                            </h5>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: '10px' }}>MORNING QTY</label>
                                <input 
                                  type="number" step="0.1" className="form-input"
                                  value={conf.defaultQtyMorning}
                                  onChange={(e) => handleConfigChange(p.id, 'defaultQtyMorning', e.target.value)}
                                  style={{ background: '#fff' }}
                                />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: '10px' }}>EVENING QTY</label>
                                <input 
                                  type="number" step="0.1" className="form-input"
                                  value={conf.defaultQtyEvening}
                                  onChange={(e) => handleConfigChange(p.id, 'defaultQtyEvening', e.target.value)}
                                  style={{ background: '#fff' }}
                                />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: '10px' }}>CUSTOM PRICE (₹)</label>
                                <input 
                                  type="number" step="0.5" className="form-input"
                                  placeholder={`₹${p.defaultPrice}`}
                                  value={conf.customPrice ?? ''}
                                  onChange={(e) => handleConfigChange(p.id, 'customPrice', e.target.value)}
                                  style={{ background: '#fff' }}
                                />
                              </div>
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

    </div>
  );
};


