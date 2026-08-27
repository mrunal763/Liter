import React, { useState, useEffect } from 'react';
import { 
  Calendar, Send, FileText, CheckCircle, AlertCircle, RefreshCw, 
  Search, Filter, Printer, Eye, X, User, Phone, MapPin, Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface CustomerOption {
  id: number;
  name: string;
  mobileNumber?: string;
  address?: string;
}

interface BillItem {
  id?: number;
  product?: {
    id: number;
    name: string;
    unit: string;
    defaultPrice: number;
  };
  totalQuantity: number;
  averagePrice: number;
  totalAmount: number;
}

interface DeliveryTransaction {
  id: number;
  deliveryDate: string;
  productName: string;
  unit: string;
  quantity: number;
  appliedPrice: number;
  totalAmount: number;
  status: string;
}

interface Bill {
  id: number;
  customer?: {
    id: number;
    name: string;
    mobileNumber: string;
    address: string;
  };
  customerId?: number;
  customerName?: string;
  customerMobile?: string;
  billPeriodStart: string;
  billPeriodEnd: string;
  issueDate?: string;
  totalAmount: number;
}

export const Billing: React.FC = () => {
  const { authFetch } = useAuth();

  // Filters State
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data State
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [upiId] = useState('mrunaldairy@upi');
  const [businessName] = useState('Made with ❤️ by Mrunal');
  const [businessPhone] = useState('+91 9876543210');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Selected Invoice Modal State
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [selectedBillItems, setSelectedBillItems] = useState<BillItem[]>([]);
  const [selectedBillDaywise, setSelectedBillDaywise] = useState<DeliveryTransaction[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch Customers for Filter Dropdown
  const fetchCustomers = async () => {
    try {
      const response = await authFetch('/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (e) {
      console.error('Error fetching customers list:', e);
    }
  };

  // Fetch Bills with Applied Filters (Inclusive Date Range, Customer)
  const fetchBills = async () => {
    setLoading(true);
    try {
      let queryUrl = `/billing/history?start=${startDate}&end=${endDate}`;
      if (selectedCustomerId !== 'ALL') {
        queryUrl += `&customerId=${selectedCustomerId}`;
      }

      const response = await authFetch(queryUrl);
      if (response.ok) {
        const data = await response.json();
        setBills(data);
      } else {
        loadMockBills();
      }
    } catch (e) {
      loadMockBills();
    } finally {
      setLoading(false);
    }
  };

  const loadMockBills = () => {
    const mocks: Bill[] = [
      { 
        id: 101, 
        customerId: 1, 
        customer: { id: 1, name: 'Ramesh Patil', mobileNumber: '9876543210', address: 'Plot 4, Krishna Nagar, Pune' },
        customerName: 'Ramesh Patil', 
        customerMobile: '9876543210', 
        billPeriodStart: startDate, 
        billPeriodEnd: endDate, 
        issueDate: format(new Date(), 'yyyy-MM-dd'),
        totalAmount: 1820.00
      },
      { 
        id: 102, 
        customerId: 2, 
        customer: { id: 2, name: 'Suresh Kumar', mobileNumber: '9812345678', address: 'Flat 302, Green Avenue, Pune' },
        customerName: 'Suresh Kumar', 
        customerMobile: '9812345678', 
        billPeriodStart: startDate, 
        billPeriodEnd: endDate, 
        issueDate: format(new Date(), 'yyyy-MM-dd'),
        totalAmount: 3600.00
      },
      { 
        id: 103, 
        customerId: 3, 
        customer: { id: 3, name: 'Mahesh Deshmukh', mobileNumber: '9567890123', address: 'House 12, Shivajinagar, Pune' },
        customerName: 'Mahesh Deshmukh', 
        customerMobile: '9567890123', 
        billPeriodStart: startDate, 
        billPeriodEnd: endDate, 
        issueDate: format(new Date(), 'yyyy-MM-dd'),
        totalAmount: 2470.00
      }
    ];

    let filtered = mocks;
    if (selectedCustomerId !== 'ALL') {
      filtered = filtered.filter(b => (b.customer?.id || b.customerId) === Number(selectedCustomerId));
    }
    setBills(filtered);
  };

  useEffect(() => {
    fetchCustomers();
    fetchBills();
  }, []);

  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchBills();
  };

  // Open Detailed Columnar Invoice Modal
  const handleOpenInvoiceModal = async (bill: Bill) => {
    setSelectedBill(bill);
    setModalLoading(true);
    setSelectedBillItems([]);
    setSelectedBillDaywise([]);

    try {
      // 1. Fetch Product Summary Items
      const itemsRes = await authFetch(`/billing/${bill.id}/items`);
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setSelectedBillItems(itemsData);
      }

      // 2. Fetch Day-wise Columnar Delivery Transactions
      const daywiseRes = await authFetch(`/billing/${bill.id}/daywise`);
      if (daywiseRes.ok) {
        const daywiseData = await daywiseRes.json();
        setSelectedBillDaywise(daywiseData);
      }
    } catch (err) {
      console.error('Error loading invoice details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleShareWhatsApp = (bill: Bill) => {
    const custName = bill.customer?.name || bill.customerName || 'Valued Customer';
    const custPhone = bill.customer?.mobileNumber || bill.customerMobile || '';
    const startF = format(new Date(bill.billPeriodStart), 'dd MMM yyyy');
    const endF = format(new Date(bill.billPeriodEnd), 'dd MMM yyyy');

    const text = `*${businessName}*
*BILL STATEMENT*
---------------------------------------
👤 Customer: *${custName}*
📅 Period: ${startF} to ${endF} (Inclusive)
---------------------------------------
💵 Total Bill Amount: *₹${bill.totalAmount.toFixed(2)}*
---------------------------------------
💳 UPI ID: *${upiId}*
📞 Support: ${businessPhone}
Thank you for your business! 🙏`;

    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/91${custPhone.replace(/[^0-9]/g, '')}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  // Filter bills by search query
  const filteredBills = bills.filter(b => {
    const name = (b.customer?.name || b.customerName || '').toLowerCase();
    const phone = (b.customer?.mobileNumber || b.customerMobile || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    return name.includes(q) || phone.includes(q);
  });

  // Calculate Aggregated Page Statistics
  const totalBilledSum = filteredBills.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* 1. FILTERS BAR (INCLUSIVE DATE RANGE, CUSTOMER SEARCH) */}
      <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--primary-green)', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--primary-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={20} style={{ color: 'var(--primary-green)' }} />
            <span>Billing Filters & Ledger Statements</span>
          </h3>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-green)', backgroundColor: 'var(--light-green)', padding: '4px 10px', borderRadius: '12px' }}>
            Inclusive Date Range Enabled
          </span>
        </div>

        <form onSubmit={handleApplyFilters} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            
            {/* Start Date */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>START DATE (INCLUSIVE) *</label>
              <input 
                type="date" className="form-input" required
                value={startDate} onChange={(e) => setStartDate(e.target.value)}
                style={{ background: '#fff', fontWeight: 600 }}
              />
            </div>

            {/* End Date */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>END DATE (INCLUSIVE) *</label>
              <input 
                type="date" className="form-input" required
                value={endDate} onChange={(e) => setEndDate(e.target.value)}
                style={{ background: '#fff', fontWeight: 600 }}
              />
            </div>

            {/* Customer Filter Dropdown */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>CUSTOMER SELECTION</label>
              <select
                className="form-input"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={{ background: '#fff', fontWeight: 600 }}
              >
                <option value="ALL">👥 All Customers ({customers.length})</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.mobileNumber ? `(${c.mobileNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '4px' }}>
            <button 
              type="submit" 
              className="btn-primary"
              style={{ padding: '10px 22px', display: 'flex', gap: '8px', alignItems: 'center', width: 'auto', fontWeight: 700 }}
            >
              <Search size={16} />
              <span>Apply Filters & Fetch Statements</span>
            </button>
          </div>
        </form>
      </div>

      {/* Messages */}
      {message && (
        <div style={{
          backgroundColor: message.type === 'success' ? '#D1FAE5' : '#FEE2E2',
          border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FCA5A5'}`,
          color: message.type === 'success' ? '#065F46' : 'var(--error-color)',
          padding: '12px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px',
          fontSize: '14px', fontWeight: 600
        }}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 2. TOP AGGREGATED METRICS BAR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#fff', border: '1px solid var(--border-color)', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', color: 'var(--secondary-text)', fontWeight: 700, textTransform: 'uppercase' }}>Total Ledger Statements</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary-text)', marginTop: '4px' }}>{filteredBills.length}</div>
        </div>

        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#D1FAE5', border: '1px solid #A7F3D0' }}>
          <div style={{ fontSize: '12px', color: '#065F46', fontWeight: 700, textTransform: 'uppercase' }}>Total Billed Amount</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#065F46', marginTop: '4px' }}>₹{totalBilledSum.toFixed(2)}</div>
        </div>
      </div>

      {/* 3. CUSTOMER BILLS DIRECTORY LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--primary-text)' }}>
            Customer Statements ({filteredBills.length})
          </h3>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary-text)' }} />
            <input 
              type="text" 
              placeholder="Search customer or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 32px', borderRadius: '8px',
                border: '1px solid var(--border-color)', fontSize: '13px', background: '#fff'
              }}
            />
          </div>
        </div>

        {filteredBills.length === 0 ? (
          <div className="card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--secondary-text)' }}>
            <FileText size={42} style={{ color: 'var(--secondary-text)', opacity: 0.5, marginBottom: '10px' }} />
            <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--primary-text)' }}>No bill statements found for selected filters</h4>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Select date range or customer and click <strong>Apply Filters</strong>.</p>
          </div>
        ) : (
          filteredBills.map(bill => {
            const custName = bill.customer?.name || bill.customerName || 'Customer';
            const custMobile = bill.customer?.mobileNumber || bill.customerMobile || 'No phone';

            return (
              <div key={bill.id} className="card" style={{ padding: '18px', borderLeft: '4px solid var(--primary-green)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--primary-text)' }}>{custName}</h4>
                    
                    <div style={{ fontSize: '13px', color: 'var(--secondary-text)', marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                      <span>📞 {custMobile}</span>
                      <span>📅 Period: <strong>{bill.billPeriodStart}</strong> to <strong>{bill.billPeriodEnd}</strong> (Inclusive)</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-green)' }}>
                      Total: ₹{bill.totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', gap: '10px' }}>
                  <button
                    onClick={() => handleOpenInvoiceModal(bill)}
                    style={{
                      backgroundColor: 'var(--light-green)', color: 'var(--primary-green)',
                      padding: '8px 14px', borderRadius: '8px', border: 'none',
                      fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Eye size={15} />
                    <span>View Invoice & Columnar Breakdown</span>
                  </button>

                  <button
                    onClick={() => handleShareWhatsApp(bill)}
                    style={{
                      backgroundColor: '#E8F5E9', color: '#2E7D32',
                      padding: '8px 14px', borderRadius: '8px', border: '1px solid #A5D6A7',
                      fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Send size={15} />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. PROFESSIONAL COLUMNAR INVOICE INSPECTOR MODAL */}
      {selectedBill && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '16px'
        }}>
          <div className="card printable-area" style={{
            width: '100%', maxWidth: '820px', maxHeight: '92vh', overflowY: 'auto',
            padding: '28px', borderRadius: '16px', backgroundColor: '#fff',
            display: 'flex', flexDirection: 'column', gap: '20px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}>

            {/* Modal Header Controls (Hide during browser print) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={18} />
                <span>Customer Statement / Invoice Breakdown</span>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button" onClick={handlePrintInvoice}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer size={16} />
                  <span>Print PDF</span>
                </button>

                <button
                  type="button" onClick={() => handleShareWhatsApp(selectedBill)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#25D366', color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={16} />
                  <span>Share WhatsApp</span>
                </button>

                <button onClick={() => setSelectedBill(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  <X size={22} style={{ color: 'var(--secondary-text)' }} />
                </button>
              </div>
            </div>

            {/* UPPER SIDE HEADER: DAIRY / USER DETAILS & CUSTOMER DETAILS */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px',
              backgroundColor: '#F9FAFB', padding: '20px', borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              
              {/* DAIRY / USER DETAILS (LEFT) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={20} />
                  <span>{businessName}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--secondary-text)', fontWeight: 600 }}>
                  Fresh Dairy Product Distribution
                </div>
                <div style={{ fontSize: '13px', color: 'var(--primary-text)', marginTop: '4px', fontWeight: 600 }}>
                  📞 Owner Contact: {businessPhone}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--primary-text)', fontWeight: 600 }}>
                  💳 UPI ID: <strong style={{ color: 'var(--primary-green)' }}>{upiId}</strong>
                </div>
              </div>

              {/* CUSTOMER & INVOICE DETAILS (RIGHT) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary-text)', letterSpacing: '0.5px' }}>
                  BILL STATEMENT
                </div>
                <div style={{ fontSize: '13px', color: 'var(--secondary-text)', fontWeight: 700 }}>
                  Statement #: <strong>#STMT-{selectedBill.id}</strong>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--secondary-text)', fontWeight: 700 }}>
                  Period: <strong>{selectedBill.billPeriodStart}</strong> to <strong>{selectedBill.billPeriodEnd}</strong> (Inclusive)
                </div>

                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--secondary-text)', fontWeight: 700, textTransform: 'uppercase' }}>CUSTOMER DETAILS:</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary-text)' }}>
                    {selectedBill.customer?.name || selectedBill.customerName}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--primary-text)', fontWeight: 600 }}>
                    📞 {selectedBill.customer?.mobileNumber || selectedBill.customerMobile}
                  </div>
                  {selectedBill.customer?.address && (
                    <div style={{ fontSize: '12px', color: 'var(--secondary-text)', marginTop: '2px' }}>
                      🏠 {selectedBill.customer.address}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {modalLoading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--secondary-text)' }}>
                Loading itemized columnar breakdown...
              </div>
            ) : (
              <>
                {/* PRODUCT WISE SUMMARY TABLE */}
                {selectedBillItems.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: 'var(--primary-text)' }}>
                      📦 Product Summary Breakdown
                    </h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F3F4F6', color: 'var(--primary-text)', textAlign: 'left', fontWeight: 800, borderBottom: '2px solid var(--border-color)' }}>
                          <th style={{ padding: '8px 12px' }}>Product</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center' }}>Total Qty</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Rate (₹)</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBillItems.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 700 }}>{item.product?.name || 'Milk'}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700 }}>{item.totalQuantity} {item.product?.unit || 'L'}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{item.averagePrice.toFixed(2)}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: 'var(--primary-green)' }}>₹{item.totalAmount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* DAY-WISE COLUMNAR DELIVERY BREAKDOWN TABLE */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: 'var(--primary-text)' }}>
                    📅 Columnar Day-Wise Delivery Log (Inclusive)
                  </h4>
                  {selectedBillDaywise.length === 0 ? (
                    <div style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px', fontSize: '13px', color: 'var(--secondary-text)', textAlign: 'center' }}>
                      Daily breakdown transaction logs compiled for statement.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--light-green)', color: 'var(--primary-green)', textAlign: 'left', fontWeight: 800, borderBottom: '2px solid #A7F3D0' }}>
                            <th style={{ padding: '8px 10px' }}>#</th>
                            <th style={{ padding: '8px 10px' }}>Date</th>
                            <th style={{ padding: '8px 10px' }}>Product</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Unit Rate</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center' }}>Delivered Qty</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Subtotal (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBillDaywise.map((tx, idx) => (
                            <tr key={tx.id || idx} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                              <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--secondary-text)' }}>{idx + 1}</td>
                              <td style={{ padding: '8px 10px', fontWeight: 700 }}>{tx.deliveryDate}</td>
                              <td style={{ padding: '8px 10px', fontWeight: 700 }}>{tx.productName}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{tx.appliedPrice?.toFixed(2)} / {tx.unit}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800, color: 'var(--primary-green)' }}>{tx.quantity} {tx.unit}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800 }}>₹{tx.totalAmount?.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* BOTTOM FINANCIAL SUMMARY & GRAND TOTAL */}
                <div style={{
                  display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '2px solid var(--border-color)'
                }}>
                  <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: '10px', backgroundColor: '#D1FAE5',
                      border: '1px solid #6EE7B7'
                    }}>
                      <span style={{ fontSize: '15px', fontWeight: 900, color: '#065F46' }}>GRAND TOTAL:</span>
                      <span style={{ fontSize: '22px', fontWeight: 900, color: '#065F46' }}>₹{selectedBill.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
