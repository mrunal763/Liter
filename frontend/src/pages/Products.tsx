import React, { useState, useEffect } from 'react';
import { Package, Plus, X, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Product {
  id?: number;
  name: string;
  category: string;
  unit: 'L' | 'ml' | 'kg' | 'g' | 'piece';
  defaultPrice: number;
  active: boolean;
  description: string;
}

export const Products: React.FC = () => {
  const { authFetch } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newProd, setNewProd] = useState<Product>({
    name: '', category: 'Milk', unit: 'L', defaultPrice: 60.00, active: true, description: ''
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await authFetch('/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        loadMockProducts();
      }
    } catch (e) {
      loadMockProducts();
    } finally {
      setLoading(false);
    }
  };

  const loadMockProducts = () => {
    setProducts([
      { id: 1, name: 'Milk', category: 'Milk', unit: 'L', defaultPrice: 60.00, active: true, description: 'Fresh Cow Milk' },
      { id: 2, name: 'Curd', category: 'Curd', unit: 'kg', defaultPrice: 80.00, active: true, description: 'Creamy Sour Curd' },
      { id: 3, name: 'Paneer', category: 'Paneer', unit: 'kg', defaultPrice: 320.00, active: true, description: 'Soft Cottage Cheese' },
      { id: 4, name: 'Ghee', category: 'Ghee', unit: 'kg', defaultPrice: 650.00, active: true, description: 'Pure Buffalo Ghee' },
      { id: 5, name: 'Butter', category: 'Butter', unit: 'kg', defaultPrice: 420.00, active: true, description: '' },
      { id: 6, name: 'Lassi', category: 'Lassi', unit: 'piece', defaultPrice: 20.00, active: true, description: 'Sweet Lassi bottle' }
    ]);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name.trim() || newProd.defaultPrice < 0) return;

    try {
      const response = await authFetch('/products', {
        method: 'POST',
        body: JSON.stringify(newProd)
      });
      if (response.ok) {
        fetchProducts();
        setShowAddModal(false);
        setNewProd({ name: '', category: 'Milk', unit: 'L', defaultPrice: 60.00, active: true, description: '' });
      } else {
        setProducts([...products, { ...newProd, id: Date.now() }]);
        setShowAddModal(false);
      }
    } catch (err) {
      setProducts([...products, { ...newProd, id: Date.now() }]);
      setShowAddModal(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Title block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '18px' }}>Available Products ({products.length})</h3>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary" 
          style={{ width: 'auto', display: 'flex', gap: '8px', padding: '10px 16px', borderRadius: '8px' }}
        >
          <Plus size={18} />
          <span>New Product</span>
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--secondary-text)' }}>Loading catalog...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
          {products.map(p => (
            <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ 
                  backgroundColor: 'var(--light-green)', 
                  color: 'var(--primary-green)', 
                  padding: '10px', 
                  borderRadius: '10px' 
                }}>
                  <Package size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 600 }}>{p.name}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--secondary-text)', marginTop: '2px' }}>
                    {p.description || 'No description'}
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-green)' }}>
                  ₹{p.defaultPrice.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--secondary-text)', marginTop: '2px' }}>
                  per {p.unit}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
          padding: '16px'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px' }}>Add Product</h3>
              <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input 
                  type="text" className="form-input" required
                  value={newProd.name} onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  placeholder="e.g. Paneer"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  className="form-input"
                  value={newProd.category} onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                  style={{ background: 'var(--white)', padding: '12px' }}
                >
                  <option value="Milk">Milk</option>
                  <option value="Curd">Curd</option>
                  <option value="Ghee">Ghee</option>
                  <option value="Paneer">Paneer</option>
                  <option value="Butter">Butter</option>
                  <option value="Lassi">Lassi</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select 
                    className="form-input"
                    value={newProd.unit} onChange={(e) => setNewProd({ ...newProd, unit: e.target.value as any })}
                    style={{ background: 'var(--white)' }}
                  >
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="piece">piece</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Default Price *</label>
                  <input 
                    type="number" step="0.01" className="form-input" required
                    value={newProd.defaultPrice} onChange={(e) => setNewProd({ ...newProd, defaultPrice: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input 
                  type="text" className="form-input" 
                  value={newProd.description} onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                  placeholder="e.g. Soft Cottage Cheese"
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>Save Product</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
