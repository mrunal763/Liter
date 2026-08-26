import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, X, Calendar, User, DollarSign, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

interface Payment {
  id: number;
  customerId: number;
  customerName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
  referenceNumber: string;
  notes: string;
}

interface Customer {
  id: number;
  name: string;
}

export const Payments: React.FC = () => {
  const { authFetch } = useAuth();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Payment Form State
  const [newPay, setNewPay] = useState({
    customerId: '',
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    paymentMethod: 'UPI' as Payment['paymentMethod'],
    referenceNumber: '',
    notes: ''
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await authFetch('/payments');
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      } else {
        loadMockPayments();
      }
    } catch (e) {
      loadMockPayments();
    } finally {
      setLoading(false);
    }
  };

  const loadMockPayments = () => {
    setPayments([
      { id: 1, customerId: 1, customerName: 'Ramesh Patil', paymentDate: '2026-08-25', amount: 1000.00, paymentMethod: 'UPI', referenceNumber: 'UPI764839', notes: 'FIFO Partial payment' },
      { id: 2, customerId: 2, customerName: 'Suresh Kumar', paymentDate: '2026-08-25', amount: 3600.00, paymentMethod: 'CASH', referenceNumber: '', notes: 'Fully Settled' }
    ]);
  };

  const fetchCustomers = async () => {
    try {
      const response = await authFetch('/customers?status=ACTIVE');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      } else {
        setCustomers([
          { id: 1, name: 'Ramesh Patil' },
          { id: 2, name: 'Suresh Kumar' },
          { id: 3, name: 'Mahesh Deshmukh' }
        ]);
      }
    } catch (e) {
      setCustomers([
        { id: 1, name: 'Ramesh Patil' },
        { id: 2, name: 'Suresh Kumar' },
        { id: 3, name: 'Mahesh Deshmukh' }
      ]);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchCustomers();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(newPay.amount);
    if (!newPay.customerId || isNaN(amt) || amt <= 0) return;

    try {
      const response = await authFetch('/payments', {
        method: 'POST',
        body: JSON.stringify({
          customerId: Number(newPay.customerId),
          paymentDate: newPay.paymentDate,
          amount: amt,
          paymentMethod: newPay.paymentMethod,
          referenceNumber: newPay.referenceNumber,
          notes: newPay.notes
        })
      });

      if (response.ok) {
        setSuccessMsg('Payment recorded successfully! Outstanding balance updated.');
        fetchPayments();
        setShowAddModal(false);
        setNewPay({
          customerId: '', paymentDate: format(new Date(), 'yyyy-MM-dd'), amount: '',
          paymentMethod: 'UPI', referenceNumber: '', notes: ''
        });
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        // Mock fallback push
        const custName = customers.find(c => c.id === Number(newPay.customerId))?.name || 'Customer';
        setPayments([
          {
            id: Date.now(),
            customerId: Number(newPay.customerId),
            customerName: custName,
            paymentDate: newPay.paymentDate,
            amount: amt,
            paymentMethod: newPay.paymentMethod,
            referenceNumber: newPay.referenceNumber,
            notes: newPay.notes
          },
          ...payments
        ]);
        setShowAddModal(false);
      }
    } catch (err) {
      const custName = customers.find(c => c.id === Number(newPay.customerId))?.name || 'Customer';
      setPayments([
        {
          id: Date.now(),
          customerId: Number(newPay.customerId),
          customerName: custName,
          paymentDate: newPay.paymentDate,
          amount: amt,
          paymentMethod: newPay.paymentMethod,
          referenceNumber: newPay.referenceNumber,
          notes: newPay.notes
        },
        ...payments
      ]);
      setShowAddModal(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Title / Action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '18px' }}>Payments Ledger ({payments.length})</h3>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary" 
          style={{ width: 'auto', display: 'flex', gap: '8px', padding: '10px 16px', borderRadius: '8px' }}
        >
          <Plus size={18} />
          <span>Add Payment</span>
        </button>
      </div>

      {successMsg && (
        <div style={{
          backgroundColor: '#D1FAE5',
          border: '1px solid #A7F3D0',
          color: '#065F46',
          padding: '12px',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: 500
        }}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--secondary-text)' }}>Loading history...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {payments.map(p => (
            <div key={p.id} className="card" style={{ padding: '16px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 600 }}>{p.customerName}</h4>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: 'var(--secondary-text)', marginTop: '4px' }}>
                    <span className="badge badge-success" style={{ padding: '2px 6px', fontSize: '10px' }}>
                      {p.paymentMethod}
                    </span>
                    <span>{format(new Date(p.paymentDate), 'dd MMM yyyy')}</span>
                  </div>
                  
                  {p.referenceNumber && (
                    <div style={{ fontSize: '11px', color: 'var(--secondary-text)', marginTop: '2px' }}>
                      Ref: {p.referenceNumber}
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-green)' }}>
                  +₹{p.amount.toFixed(2)}
                </div>
              </div>
              
              {p.notes && (
                <div style={{ fontSize: '12px', color: 'var(--secondary-text)', marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                  Note: {p.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
          padding: '16px'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px' }}>Record Payment</h3>
              <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label className="form-label">Select Customer *</label>
                <select 
                  className="form-input" required
                  value={newPay.customerId} 
                  onChange={(e) => setNewPay({ ...newPay, customerId: e.target.value })}
                  style={{ background: 'var(--white)' }}
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="billing-date-grid" style={{ gap: '12px', marginBottom: 0 }}>
                <div className="form-group">
                  <label className="form-label">Payment Date</label>
                  <input 
                    type="date" className="form-input" required
                    value={newPay.paymentDate} 
                    onChange={(e) => setNewPay({ ...newPay, paymentDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Amount Collected (₹) *</label>
                  <input 
                    type="number" step="0.01" min="1" className="form-input" required
                    placeholder="₹ 0.00"
                    value={newPay.amount} 
                    onChange={(e) => setNewPay({ ...newPay, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select 
                  className="form-input"
                  value={newPay.paymentMethod} 
                  onChange={(e) => setNewPay({ ...newPay, paymentMethod: e.target.value as any })}
                  style={{ background: 'var(--white)' }}
                >
                  <option value="UPI">UPI (PhonePe, GPay, Paytm)</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer (IMPS, NEFT)</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">UPI Reference / UTR Number</label>
                <input 
                  type="text" className="form-input" 
                  placeholder="e.g. UPI87249103"
                  value={newPay.referenceNumber} 
                  onChange={(e) => setNewPay({ ...newPay, referenceNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <input 
                  type="text" className="form-input" 
                  placeholder="e.g. Cleared past due"
                  value={newPay.notes} 
                  onChange={(e) => setNewPay({ ...newPay, notes: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
                Save Payment
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
