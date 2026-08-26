import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Plus, Edit, Check, Settings, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Customer {
  id?: number;
  name: string;
  mobileNumber: string;
  address: string;
  village: string;
  landmark: string;
  startDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  notes: string;
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
  customPrice: number | null; // null represents use default
}

export const Customers: React.FC = () => {
  const { authFetch } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [loading, setLoading] = useState(false);

  // Modals / Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // New Customer Form State
  const [newCust, setNewCust] = useState<Customer>({
    name: '', mobileNumber: '', address: '', village: '', landmark: '',
    startDate: new Date().toISOString().split('T')[0], status: 'ACTIVE', notes: ''
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
    const mockCust: Customer[] = [
      { id: 1, name: 'Ramesh Patil', mobileNumber: '9876543210', address: 'Plot 4, Lane 2', village: 'Krishna Nagar', landmark: 'Near Temple', startDate: '2026-08-01', status: 'ACTIVE', notes: 'Prefers morning delivery' },
      { id: 2, name: 'Suresh Kumar', mobileNumber: '9812345678', address: 'Galli 1', village: 'Shivaji Colony', landmark: 'Opposite School', startDate: '2026-08-05', status: 'ACTIVE', notes: '' },
      { id: 3, name: 'Mahesh Deshmukh', mobileNumber: '9567890123', address: 'Room 12, Block B', village: 'Ganesh Wadi', landmark: 'Beside Market', startDate: '2026-08-10', status: 'ACTIVE', notes: 'Ghee buyer' }
    ];
    setCustomers(mockCust.filter(c => c.status === filter));
  };

  const fetchProducts = async () => {
    try {
      const response = await authFetch('/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        setProducts([
          { id: 1, name: 'Milk', unit: 'L', defaultPrice: 60.00 },
          { id: 2, name: 'Curd', unit: 'kg', defaultPrice: 80.00 }
        ]);
      }
    } catch (e) {
      setProducts([
        { id: 1, name: 'Milk', unit: 'L', defaultPrice: 60.00 },
        { id: 2, name: 'Curd', unit: 'kg', defaultPrice: 80.00 }
      ]);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [filter]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name.trim()) return;

    try {
      const response = await authFetch('/customers', {
        method: 'POST',
        body: JSON.stringify(newCust)
      });

      if (response.ok) {
        fetchCustomers();
        setShowAddModal(false);
        setNewCust({
          name: '', mobileNumber: '', address: '', village: '', landmark: '',
          startDate: new Date().toISOString().split('T')[0], status: 'ACTIVE', notes: ''
        });
      } else {
        // Fallback local append for visual feedback
        setCustomers([...customers, { ...newCust, id: Date.now() }]);
        setShowAddModal(false);
      }
    } catch (err) {
      setCustomers([...customers, { ...newCust, id: Date.now() }]);
      setShowAddModal(false);
    }
  };

  const handleToggleStatus = async (customer: Customer) => {
    const newStatus = customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const response = await authFetch(`/customers/${customer.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchCustomers();
      } else {
        setCustomers(customers.filter(c => c.id !== customer.id));
      }
    } catch (e) {
      setCustomers(customers.filter(c => c.id !== customer.id));
    }
  };

  const openConfigurator = async (cust: Customer) => {
    setSelectedCustomer(cust);
    setShowConfigModal(true);
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
  };

  const loadMockConfigs = (custId: number) => {
    // Generate default configs for products
    setConfigs(products.map(p => ({
      productId: p.id,
      defaultQtyMorning: p.id === 1 ? 1.0 : 0.0,
      defaultQtyEvening: 0.0,
      customPrice: p.id === 1 ? 55.00 : null
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
      // Put configurations individually or bulk
      for (const config of configs) {
        await authFetch(`/customers/${selectedCustomer.id}/configs/${config.productId}`, {
          method: 'PUT',
          body: JSON.stringify(config)
        });
      }
      setShowConfigModal(false);
    } catch (e) {
      setShowConfigModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Search and Tabs */}
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
            Active
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
          onClick={() => setShowAddModal(true)}
          className="btn-primary" 
          style={{ width: 'auto', display: 'flex', gap: '8px', padding: '10px 16px', borderRadius: '8px' }}
        >
          <Plus size={18} />
          <span>Add</span>
        </button>
      </div>

      {/* Customer Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {customers.map(c => (
          <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 12px' }}>
            <div>
              <h4 style={{ fontSize: '17px', fontWeight: 600 }}>{c.name}</h4>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--secondary-text)', marginTop: '4px' }}>
                <Phone size={13} />
                <span>{c.mobileNumber || 'No number'}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--secondary-text)', marginTop: '2px' }}>
                <MapPin size={13} />
                <span>{c.village ? `${c.village}` : 'No address'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => openConfigurator(c)}
                style={{
                  backgroundColor: 'var(--light-green)',
                  color: 'var(--primary-green)',
                  padding: '10px',
                  borderRadius: '8px'
                }}
                title="Configure subscriptions & pricing"
              >
                <Settings size={18} />
              </button>
              
              <button 
                onClick={() => handleToggleStatus(c)}
                style={{
                  backgroundColor: filter === 'ACTIVE' ? '#FEE2E2' : '#D1FAE5',
                  color: filter === 'ACTIVE' ? 'var(--error-color)' : 'var(--primary-green)',
                  padding: '10px',
                  borderRadius: '8px'
                }}
              >
                {filter === 'ACTIVE' ? 'Deact' : 'React'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal 1: Add Customer */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
          padding: '16px'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px' }}>Add New Customer</h3>
              <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" className="form-input" required
                  value={newCust.name} onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  placeholder="e.g. Ramesh Patil"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input 
                  type="tel" className="form-input" 
                  value={newCust.mobileNumber} onChange={(e) => setNewCust({ ...newCust, mobileNumber: e.target.value })}
                  placeholder="10-digit mobile"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Village / Town</label>
                <input 
                  type="text" className="form-input" 
                  value={newCust.village} onChange={(e) => setNewCust({ ...newCust, village: e.target.value })}
                  placeholder="e.g. Krishna Nagar"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Landmark</label>
                <input 
                  type="text" className="form-input" 
                  value={newCust.landmark} onChange={(e) => setNewCust({ ...newCust, landmark: e.target.value })}
                  placeholder="e.g. Near Temple"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address Description</label>
                <input 
                  type="text" className="form-input" 
                  value={newCust.address} onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                  placeholder="e.g. Plot 4, Lane 2"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input 
                  type="date" className="form-input" 
                  value={newCust.startDate} onChange={(e) => setNewCust({ ...newCust, startDate: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>Save Customer</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Subscription & Price Overrides Configurator */}
      {showConfigModal && selectedCustomer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
          padding: '16px'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px' }}>Setup Subscription</h3>
                <p style={{ fontSize: '12px', color: 'var(--secondary-text)' }}>Customer: {selectedCustomer.name}</p>
              </div>
              <button onClick={() => setShowConfigModal(false)}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {products.map(p => {
                const conf = configs.find(c => c.productId === p.id) || {
                  productId: p.id, defaultQtyMorning: 0, defaultQtyEvening: 0, customPrice: null
                };

                return (
                  <div key={p.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                    <h4 style={{ color: 'var(--primary-green)', fontWeight: 700, marginBottom: '10px' }}>
                      {p.name} (Unit: {p.unit})
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '11px' }}>DEFAULT MORNING QTY</label>
                        <input 
                          type="number" step="0.01" className="form-input"
                          value={conf.defaultQtyMorning}
                          onChange={(e) => handleConfigChange(p.id, 'defaultQtyMorning', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '11px' }}>DEFAULT EVENING QTY</label>
                        <input 
                          type="number" step="0.01" className="form-input"
                          value={conf.defaultQtyEvening}
                          onChange={(e) => handleConfigChange(p.id, 'defaultQtyEvening', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>
                        CUSTOM PRICE (Leave blank to use default: ₹{p.defaultPrice}/{p.unit})
                      </label>
                      <input 
                        type="number" step="0.01" className="form-input"
                        placeholder={`Default is ₹${p.defaultPrice}`}
                        value={conf.customPrice ?? ''}
                        onChange={(e) => handleConfigChange(p.id, 'customPrice', e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={handleConfigSubmit} 
              className="btn-primary" 
              style={{ marginTop: '20px' }}
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
