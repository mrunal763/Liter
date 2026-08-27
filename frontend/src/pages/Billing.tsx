import React, { useState, useEffect } from 'react';
import { 
  Calendar, FileText, CheckCircle, AlertCircle, RefreshCw, 
  Search, Filter, Printer, Eye, X, Download, Building, User, Milk, Check, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

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
    mobileNumber?: string;
    address?: string;
  };
  customerId?: number;
  customerName?: string;
  customerMobile?: string;
  billPeriodStart: string;
  billPeriodEnd: string;
  issueDate?: string;
  totalAmount: number;
}

interface DairyProfile {
  businessName?: string;
  ownerName?: string;
  mobileNumber?: string;
  address?: string;
  upiId?: string;
}

export const Billing: React.FC = () => {
  const { authFetch, user } = useAuth();

  // Filters State
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data State
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [dairyProfile, setDairyProfile] = useState<DairyProfile>({
    businessName: '',
    ownerName: '',
    mobileNumber: '',
    address: '',
    upiId: ''
  });

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Selected Invoice Modal State
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [selectedBillItems, setSelectedBillItems] = useState<BillItem[]>([]);
  const [selectedBillDaywise, setSelectedBillDaywise] = useState<DeliveryTransaction[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch Logged-in Dairy Owner Profile
  const fetchDairyProfile = async () => {
    try {
      const response = await authFetch('/settings');
      if (response.ok) {
        const data = await response.json();
        setDairyProfile(data);
      }
    } catch (e) {
      console.error('Error fetching dairy profile:', e);
    }
  };

  // Fetch Customers belonging to logged-in user
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

  // Fetch Bills matching current inclusive date range & customer filters
  const fetchBills = async () => {
    if (new Date(endDate) < new Date(startDate)) {
      setMessage({ type: 'error', text: '⚠️ Invalid Date Range: End Date cannot be before Start Date.' });
      return;
    }

    setLoading(true);
    setMessage(null);
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
        const errText = await response.text();
        setMessage({ type: 'error', text: errText || 'Failed to load bills for selected period.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Network connection error while fetching billing statements.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDairyProfile();
    fetchCustomers();
    fetchBills();
  }, []);

  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchBills();
  };

  const handleClearFilters = () => {
    const startMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const endMonth = format(endOfMonth(new Date()), 'yyyy-MM-dd');
    setStartDate(startMonth);
    setEndDate(endMonth);
    setSelectedCustomerId('ALL');
    setSearchQuery('');
    setMessage(null);
  };

  // Delete Individual Bill
  const handleDeleteBill = async (billId: number, custName: string) => {
    if (!window.confirm(`Are you sure you want to delete the bill for "${custName}" (#INV-${billId})?`)) {
      return;
    }

    try {
      const response = await authFetch(`/billing/${billId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `🗑️ Bill #INV-${billId} deleted successfully.` });
        if (selectedBill?.id === billId) {
          setSelectedBill(null);
        }
        fetchBills();
      } else {
        setMessage({ type: 'error', text: 'Failed to delete bill.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error deleting bill.' });
    }
  };

  // Delete All Bills
  const handleDeleteAllBills = async () => {
    if (!window.confirm('⚠️ Are you sure you want to delete ALL generated bills? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await authFetch('/billing/all', {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage({ type: 'success', text: '🗑️ All generated bills deleted successfully.' });
        setSelectedBill(null);
        fetchBills();
      } else {
        setMessage({ type: 'error', text: 'Failed to delete all bills.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error deleting all bills.' });
    }
  };

  // Generate / Regenerate Bills for filtered customer(s)
  const handleGenerateBills = async (targetCustId?: number) => {
    if (new Date(endDate) < new Date(startDate)) {
      setMessage({ type: 'error', text: '⚠️ Invalid Date Range: End Date cannot be before Start Date.' });
      return;
    }

    setGenerating(true);
    setMessage(null);

    try {
      const payload: any = {
        startDate,
        endDate
      };

      if (targetCustId) {
        payload.customerId = targetCustId;
      } else if (selectedCustomerId !== 'ALL') {
        payload.customerId = Number(selectedCustomerId);
      }

      const response = await authFetch('/billing/generate', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setMessage({
            type: 'success',
            text: `✅ Generated ${data.length} bill statement(s) for period ${startDate} to ${endDate} (Inclusive).`
          });
        } else {
          setMessage({
            type: 'error',
            text: 'No delivered items found in this period for the selected customer(s).'
          });
        }
        fetchBills();
      } else {
        const errText = await response.text();
        setMessage({ type: 'error', text: errText || 'Failed to generate bills.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Network error generating bills.' });
    } finally {
      setGenerating(false);
    }
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

      // 2. Fetch Chronological Day-wise Delivery Transactions
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

  // Download Bill as A4 PDF using html2pdf.js
  const handleDownloadPDF = (bill: Bill) => {
    const custName = bill.customer?.name || bill.customerName || 'Customer';
    const fileName = `Bill_${custName.replace(/\s+/g, '_')}_${bill.billPeriodStart}_to_${bill.billPeriodEnd}.pdf`;

    const element = document.getElementById('bill-printable-card');
    if (!element) return;

    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     fileName,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if ((window as any).html2pdf) {
      (window as any).html2pdf().set(opt).from(element).save();
    } else {
      window.print();
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  // Filter bills by search query
  const filteredBills = bills.filter(b => {
    const name = (b.customer?.name || b.customerName || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    return name.includes(q);
  });

  // Calculate Aggregated Page Statistics
  const totalBilledSum = filteredBills.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. FILTER CONTROLS BAR (HORIZONTAL ON DESKTOP, STACKED ON MOBILE) */}
      <div className="card no-print" style={{ padding: '20px', borderLeft: '4px solid var(--primary-green)', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--primary-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={20} style={{ color: 'var(--primary-green)' }} />
            <span>Billing Date & Customer Filters</span>
          </h3>

          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-green)', backgroundColor: 'var(--light-green)', padding: '6px 12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} />
            <span>Active Billing Period: {startDate} to {endDate} (Inclusive)</span>
          </div>
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
                    {c.name}
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
              disabled={loading}
            >
              <Search size={16} />
              <span>Apply Filters</span>
            </button>

            <button 
              type="button"
              onClick={handleClearFilters}
              className="btn-secondary"
              style={{ padding: '10px 18px', display: 'flex', gap: '8px', alignItems: 'center', width: 'auto', fontWeight: 700, backgroundColor: '#F3F4F6', color: 'var(--primary-text)', border: '1px solid var(--border-color)' }}
            >
              <X size={16} />
              <span>Clear Filters</span>
            </button>

            {bills.length > 0 && (
              <button 
                type="button"
                onClick={handleDeleteAllBills}
                style={{ padding: '10px 18px', display: 'flex', gap: '8px', alignItems: 'center', width: 'auto', fontWeight: 700, backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: '8px', cursor: 'pointer' }}
              >
                <Trash2 size={16} />
                <span>Delete All Bills</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 2. TOP METRICS & TOTAL SUMMARY */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#fff', border: '1px solid var(--border-color)', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', color: 'var(--secondary-text)', fontWeight: 700, textTransform: 'uppercase' }}>Filtered Customers</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary-text)', marginTop: '4px' }}>{filteredBills.length}</div>
        </div>

        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#D1FAE5', border: '1px solid #A7F3D0' }}>
          <div style={{ fontSize: '12px', color: '#065F46', fontWeight: 700, textTransform: 'uppercase' }}>Total Billed Amount ({startDate} - {endDate})</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#065F46', marginTop: '4px' }}>₹{totalBilledSum.toFixed(2)}</div>
        </div>
      </div>

      {/* 3. FILTERED CUSTOMER BILLING DIRECTORY LIST */}
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--primary-text)' }}>
            Customer Billing Statements ({filteredBills.length})
          </h3>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary-text)' }} />
            <input 
              type="text" 
              placeholder="Search customer name..."
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
          <div className="card" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--secondary-text)' }}>
            <Milk size={48} style={{ color: 'var(--primary-green)', opacity: 0.4, marginBottom: '12px' }} />
            <h4 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--primary-text)' }}>
              No billable delivery records found for the selected period
            </h4>
            <p style={{ fontSize: '13px', marginTop: '6px', maxWidth: '480px', margin: '6px auto 16px' }}>
              No delivered transactions exist between <strong>{startDate}</strong> and <strong>{endDate}</strong> (Inclusive). Select a date range with active deliveries and click <strong>Apply Filters</strong> or <strong>Generate Bills</strong>.
            </p>
            <button
              onClick={() => handleGenerateBills()}
              className="btn-primary"
              style={{ margin: '0 auto', width: 'auto', padding: '10px 20px', fontWeight: 700 }}
            >
              Generate Bills for Period
            </button>
          </div>
        ) : (
          filteredBills.map(bill => {
            const custName = bill.customer?.name || bill.customerName || 'Customer';

            return (
              <div key={bill.id} className="card" style={{ padding: '18px', borderLeft: '4px solid var(--primary-green)', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--primary-text)' }}>{custName}</h4>
                    
                    <div style={{ fontSize: '13px', color: 'var(--secondary-text)', marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                      <span>📅 Billing Period: <strong>{bill.billPeriodStart}</strong> to <strong>{bill.billPeriodEnd}</strong> (Inclusive)</span>
                      <span>Invoice #: <strong>#INV-{bill.id}</strong></span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--secondary-text)', fontWeight: 700, textTransform: 'uppercase' }}>Grand Total</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-green)' }}>
                      ₹{bill.totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleDeleteBill(bill.id, custName)}
                    style={{
                      backgroundColor: '#FEE2E2', color: '#991B1B',
                      padding: '8px 16px', borderRadius: '8px', border: 'none',
                      fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Trash2 size={15} />
                    <span>Delete Bill</span>
                  </button>

                  <button
                    onClick={() => handleOpenInvoiceModal(bill)}
                    style={{
                      backgroundColor: 'var(--light-green)', color: 'var(--primary-green)',
                      padding: '8px 16px', borderRadius: '8px', border: 'none',
                      fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Eye size={15} />
                    <span>View Bill</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. CLEAN, PROFESSIONAL PRINTABLE BILL PREVIEW MODAL */}
      {selectedBill && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '16px'
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: '840px', maxHeight: '94vh', overflowY: 'auto',
            padding: '24px', borderRadius: '16px', backgroundColor: '#fff',
            display: 'flex', flexDirection: 'column', gap: '18px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}>

            {/* Modal Header Action Bar (Hide during browser print & PDF render) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={18} />
                <span>Bill Preview — #INV-{selectedBill.id}</span>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button" onClick={handlePrintInvoice}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary-green)', color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer size={16} />
                  <span>Print Bill</span>
                </button>

                <button
                  type="button" onClick={() => handleDeleteBill(selectedBill.id, selectedBill.customer?.name || selectedBill.customerName || 'Customer')}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#FEE2E2', color: '#991B1B', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>

                <button onClick={() => setSelectedBill(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  <X size={22} style={{ color: 'var(--secondary-text)' }} />
                </button>
              </div>
            </div>

            {/* ACTUAL PRINTABLE BILL CONTAINER (A4 FRIENDLY, MINIMAL, NO EXTRA UI) */}
            <div id="bill-printable-card" className="printable-bill-area" style={{
              padding: '24px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px',
              color: '#111827', fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>

              {/* 1. LITER BRANDING AT TOP */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--primary-green)', paddingBottom: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ backgroundColor: 'var(--primary-green)', color: '#fff', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                    <Milk size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0, color: 'var(--primary-green)', letterSpacing: '0.5px' }}>LITER</h2>
                    <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>Dairy Business Management & Delivery Statement</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#111827' }}>CUSTOMER BILL</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Bill #: <strong>#INV-{selectedBill.id}</strong></div>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Bill Date: {selectedBill.issueDate || format(new Date(), 'yyyy-MM-dd')}</div>
                </div>
              </div>

              {/* 2. CUSTOMER DETAILS FIRST */}
              <div style={{ backgroundColor: '#F9FAFB', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  CUSTOMER DETAILS
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#111827', marginTop: '2px' }}>
                  {selectedBill.customer?.name || selectedBill.customerName}
                </div>
                {selectedBill.customer?.mobileNumber && (
                  <div style={{ fontSize: '13px', color: '#374151', marginTop: '2px' }}>
                    Phone: {selectedBill.customer.mobileNumber}
                  </div>
                )}
                {selectedBill.customer?.address && (
                  <div style={{ fontSize: '13px', color: '#374151', marginTop: '2px' }}>
                    Address: {selectedBill.customer.address}
                  </div>
                )}
              </div>
              {/* 3. DAIRY OWNER / BUSINESS DETAILS IMMEDIATELY BELOW CUSTOMER DETAILS */}
              <div style={{ backgroundColor: '#F9FAFB', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  DAIRY OWNER / BUSINESS DETAILS
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-green)', marginTop: '2px' }}>
                  {dairyProfile.businessName || 'Made with ❤️ by Mrunal'}
                </div>
                <div style={{ fontSize: '13px', color: '#374151', marginTop: '2px' }}>
                  Owner: {dairyProfile.ownerName || user?.fullName || user?.username || 'Mrunal'}
                  {dairyProfile.mobileNumber ? ` | Phone: ${dairyProfile.mobileNumber}` : ''}
                </div>
                {dairyProfile.address && (
                  <div style={{ fontSize: '13px', color: '#374151', marginTop: '2px' }}>
                    Address: {dairyProfile.address}
                  </div>
                )}
                {dairyProfile.upiId && (
                  <div style={{ fontSize: '13px', color: 'var(--primary-green)', fontWeight: 700, marginTop: '2px' }}>
                    UPI Payment ID: {dairyProfile.upiId}
                  </div>
                )}
              </div>

              {/* 4. BILLING PERIOD INDICATOR */}
              <div style={{ padding: '8px 12px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '6px', fontSize: '12px', fontWeight: 700, color: '#065F46', marginBottom: '16px' }}>
                📅 Billing Period: {selectedBill.billPeriodStart} to {selectedBill.billPeriodEnd} (Inclusive)
              </div>

              {modalLoading ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                  Loading day-wise delivery purchase records...
                </div>
              ) : (
                <>
                  {/* 5. PRODUCT-WISE PURCHASE SUMMARY TABLE */}
                  {selectedBillItems.length > 0 && (
                    <div style={{ marginBottom: '18px' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 800, margin: '0 0 6px 0', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        📦 Product Summary Breakdown
                      </h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '10px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F3F4F6', color: '#374151', textAlign: 'left', fontWeight: 800, borderBottom: '2px solid #E5E7EB' }}>
                            <th style={{ padding: '8px 10px' }}>Product</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center' }}>Total Volume Delivered</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Unit Price (₹)</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Subtotal (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBillItems.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                              <td style={{ padding: '8px 10px', fontWeight: 700 }}>{item.product?.name || 'Milk'}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>{item.totalQuantity} {item.product?.unit || 'L'}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{item.averagePrice?.toFixed(2)}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: 'var(--primary-green)' }}>₹{item.totalAmount?.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 6. MAIN CHRONOLOGICAL DAY-WISE PURCHASE RECORDS TABLE */}
                  <div style={{ marginBottom: '18px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 800, margin: '0 0 6px 0', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      📅 Day-Wise Delivery & Purchase Records (Chronological)
                    </h4>

                    {selectedBillDaywise.length === 0 ? (
                      <div style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '6px', fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
                        No delivered items recorded for this period.
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F3F4F6', color: '#374151', textAlign: 'left', fontWeight: 800, borderBottom: '2px solid #E5E7EB' }}>
                            <th style={{ padding: '8px 8px', width: '35px' }}>#</th>
                            <th style={{ padding: '8px 10px' }}>Date & Day</th>
                            <th style={{ padding: '8px 10px' }}>Product</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty Delivered</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Unit Price (₹)</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Line Total (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBillDaywise.map((tx, idx) => {
                            let dateStr = tx.deliveryDate;
                            try {
                              dateStr = format(parseISO(tx.deliveryDate), 'EEE, dd MMM yyyy');
                            } catch (e) {
                              dateStr = tx.deliveryDate;
                            }

                            const prodName = tx.productName || (tx as any).product?.name || 'Milk';
                            const unitStr = tx.unit || (tx as any).product?.unit || 'L';

                            return (
                              <tr key={tx.id || idx} style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                                <td style={{ padding: '8px 8px', fontWeight: 700, color: '#6B7280' }}>{idx + 1}</td>
                                <td style={{ padding: '8px 10px', fontWeight: 700 }}>{dateStr}</td>
                                <td style={{ padding: '8px 10px', fontWeight: 600 }}>{prodName}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>{tx.quantity} {unitStr}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{tx.appliedPrice?.toFixed(2)}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#111827' }}>₹{tx.totalAmount?.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* 7. GRAND TOTAL SECTION */}
                  <div style={{
                    display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '2px solid #111827'
                  }}>
                    <div style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px', borderRadius: '8px', backgroundColor: '#ECFDF5',
                        border: '1px solid #6EE7B7'
                      }}>
                        <span style={{ fontSize: '14px', fontWeight: 900, color: '#065F46' }}>GRAND TOTAL:</span>
                        <span style={{ fontSize: '20px', fontWeight: 900, color: '#065F46' }}>₹{selectedBill.totalAmount?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                </>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
