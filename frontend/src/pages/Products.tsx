import React, { useState, useEffect } from 'react';
import { Package, Plus, X, Tag, Edit, Save, Trash2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Product {
  id?: number;
  name: string;
  category: string; // Milk, Curd, Butter Milk, Paneer, Ghee
  unit: string;
  defaultPrice: number;
  active: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Milk': '🥛',
  'Curd': '🥣',
  'Butter Milk': '🥤',
  'Paneer': '🧀',
  'Ghee': '🧈'
};

const CATEGORIES = ['Milk', 'Curd', 'Butter Milk', 'Paneer', 'Ghee'];

export const Products: React.FC = () => {
  const { authFetch } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Inline Panel States
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form States (Custom prices & units per category, default pack (sher))
  const [newProd, setNewProd] = useState<Product>({
    name: 'Milk',
    category: 'Milk',
    unit: 'pack (sher)',
    defaultPrice: 65.00,
    active: true
  });

  const [editProd, setEditProd] = useState<Product>({
    name: 'Milk',
    category: 'Milk',
    unit: 'pack (sher)',
    defaultPrice: 65.00,
    active: true
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await authFetch('/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data || []);
      } else {
        setProducts([]);
      }
    } catch (e) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCategorySelect = (selectedCategory: string) => {
    let defaultUnit = 'pack (sher)';
    let defaultPrice = 65.00;

    if (selectedCategory === 'Curd') {
      defaultUnit = 'kg'; defaultPrice = 85.00;
    } else if (selectedCategory === 'Butter Milk') {
      defaultUnit = 'pack (sher)'; defaultPrice = 30.00;
    } else if (selectedCategory === 'Paneer') {
      defaultUnit = 'kg'; defaultPrice = 340.00;
    } else if (selectedCategory === 'Ghee') {
      defaultUnit = 'kg'; defaultPrice = 700.00;
    }

    setNewProd({
      ...newProd,
      category: selectedCategory,
      name: selectedCategory,
      unit: defaultUnit,
      defaultPrice
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.category || newProd.defaultPrice < 0) return;

    const payload = {
      ...newProd,
      name: newProd.name.trim() || newProd.category
    };

    try {
      const response = await authFetch('/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        await fetchProducts();
      }
    } catch (err) {
      console.error('Error adding product:', err);
    }
    setShowAddPanel(false);
  };

  const startEdit = (prod: Product) => {
    setEditingId(prod.id!);
    setEditProd({ ...prod });
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProd || !editProd.id) return;

    const payload = {
      ...editProd,
      name: editProd.name.trim() || editProd.category
    };

    try {
      const response = await authFetch(`/products/${editProd.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        await fetchProducts();
      }
    } catch (err) {
      await fetchProducts();
    }
    setEditingId(null);
  };

  // Immediate Delete without confirmation (directly saves deletion to DB)
  const handleDeleteProduct = async (id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id));

    try {
      const response = await authFetch(`/products/${id}`, {
        method: 'DELETE'
      });
      await fetchProducts();
    } catch (err) {
      console.error('Error deleting product from database:', err);
      await fetchProducts();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Dairy Product Categories & Custom Rates</h3>
          <p style={{ fontSize: '12px', color: 'var(--secondary-text)', marginTop: '2px' }}>
            Create products by category with custom prices & units (including pack (sher)) saved directly to database
          </p>
        </div>
        
        <button 
          onClick={() => {
            setShowAddPanel(!showAddPanel);
            setEditingId(null);
          }}
          className="btn-primary" 
          style={{ width: 'auto', display: 'flex', gap: '8px', padding: '10px 16px', borderRadius: '8px' }}
        >
          {showAddPanel ? <X size={18} /> : <Plus size={18} />}
          <span>{showAddPanel ? 'Close' : 'Add Category'}</span>
        </button>
      </div>

      {/* Inline Add Category Form Panel */}
      {showAddPanel && (
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--primary-green)', backgroundColor: '#F0FDF4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--primary-green)' }}>
              ✨ Add Product Category with Custom Price
            </h4>
            <button onClick={() => setShowAddPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
          </div>

          <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Select Category *</label>
                <select 
                  className="form-input"
                  value={newProd.category} 
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  style={{ background: '#fff', fontSize: '15px', fontWeight: 700, padding: '10px' }}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {CATEGORY_ICONS[cat]} {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Product Name *</label>
                <input 
                  type="text" className="form-input" required
                  value={newProd.name} 
                  onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  placeholder="e.g. Milk, Curd 500g, Paneer 1kg"
                  style={{ background: '#fff', fontWeight: 700, padding: '10px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Unit *</label>
                <select 
                  className="form-input"
                  value={newProd.unit} 
                  onChange={(e) => setNewProd({ ...newProd, unit: e.target.value })}
                  style={{ background: '#fff', fontWeight: 600 }}
                >
                  <option value="pack (sher)">pack (sher)</option>
                  <option value="L">L (Liter)</option>
                  <option value="kg">kg (Kilogram)</option>
                  <option value="ml">ml (Milliliter)</option>
                  <option value="g">g (Gram)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Custom Price (₹) *</label>
                <input 
                  type="number" step="0.5" className="form-input" required
                  value={newProd.defaultPrice} 
                  onChange={(e) => setNewProd({ ...newProd, defaultPrice: Number(e.target.value) })}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '6px', padding: '10px' }}>
              Save Product Category
            </button>
          </form>
        </div>
      )}

      {/* Product List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--secondary-text)' }}>Loading database products...</div>
      ) : products.length === 0 ? (
        <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--secondary-text)' }}>
          <Package size={40} style={{ margin: '0 auto 12px', opacity: 0.5, color: 'var(--primary-green)' }} />
          <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--primary-text)' }}>
            No Product Categories Added Yet
          </h4>
          <p style={{ fontSize: '13px', margin: 0 }}>
            Click <strong>Add Category</strong> above to create your product categories with custom prices.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          {products.map(p => {
            const icon = CATEGORY_ICONS[p.category] || '🥛';
            const isEditing = editingId === p.id;

            if (isEditing) {
              return (
                <div key={p.id} className="card" style={{ padding: '20px', borderLeft: '4px solid var(--primary-green)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--primary-green)' }}>
                      ✏️ Edit Category ({p.category})
                    </h4>
                    <button onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                  </div>

                  <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontWeight: 600 }}>Category Name</label>
                        <select 
                          className="form-input"
                          value={editProd.category} 
                          onChange={(e) => setEditProd({ ...editProd, category: e.target.value })}
                          style={{ background: '#fff', fontWeight: 700 }}
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontWeight: 600 }}>Product Name</label>
                        <input 
                          type="text" className="form-input" required
                          value={editProd.name} 
                          onChange={(e) => setEditProd({ ...editProd, name: e.target.value })}
                          style={{ background: '#fff', fontWeight: 700 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontWeight: 600 }}>Unit</label>
                        <select 
                          className="form-input"
                          value={editProd.unit} 
                          onChange={(e) => setEditProd({ ...editProd, unit: e.target.value })}
                          style={{ background: '#fff', fontWeight: 600 }}
                        >
                          <option value="pack (sher)">pack (sher)</option>
                          <option value="L">L</option>
                          <option value="kg">kg</option>
                          <option value="ml">ml</option>
                          <option value="g">g</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontWeight: 600 }}>Custom Price (₹ / unit)</label>
                        <input 
                          type="number" step="0.5" className="form-input" required
                          value={editProd.defaultPrice} 
                          onChange={(e) => setEditProd({ ...editProd, defaultPrice: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                      <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px', display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                        <Save size={16} />
                        <span>Save to Database</span>
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="btn-secondary" style={{ padding: '10px 16px' }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              );
            }

            return (
              <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ 
                    backgroundColor: 'var(--light-green)', fontSize: '24px',
                    width: '46px', height: '46px', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {icon}
                  </div>

                  <div>
                    <h4 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--primary-text)' }}>
                      {p.name}
                    </h4>
                    <span style={{ fontSize: '12px', color: 'var(--secondary-text)' }}>
                      Category: <strong>{p.category}</strong> • Unit: <strong>{p.unit}</strong>
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-green)' }}>
                      ₹{p.defaultPrice.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--secondary-text)', marginTop: '1px' }}>
                      per {p.unit}
                    </div>
                  </div>

                  {/* ACTION BUTTONS (DIRECT DELETE WITHOUT CONFIRMATION PROMPT) */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => startEdit(p)}
                      style={{
                        backgroundColor: 'var(--light-green)', color: 'var(--primary-green)',
                        border: 'none', borderRadius: '8px', padding: '8px 12px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '12px', fontWeight: 700
                      }}
                    >
                      <Edit size={15} />
                      <span>Update</span>
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(p.id!)}
                      style={{
                        backgroundColor: '#FEE2E2', color: 'var(--error-color)',
                        border: 'none', borderRadius: '8px', padding: '8px 12px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '12px', fontWeight: 700
                      }}
                    >
                      <Trash2 size={15} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};



