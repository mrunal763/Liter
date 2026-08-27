import React, { useState, useEffect } from 'react';
import { 
  Truck, AlertCircle, Save, CheckCircle, Calendar as CalendarIcon, 
  ChevronLeft, ChevronRight, Plus, UserCheck, UserX, PackagePlus, 
  RotateCcw, X, Search, SlidersHorizontal, History as HistoryIcon,
  Edit3, HelpCircle, CheckSquare, Sparkles, Filter, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format, addDays, subDays, parseISO, isValid, startOfMonth, endOfMonth } from 'date-fns';
import { Link } from 'react-router-dom';

interface DeliveryItem {
  customerId: number;
  customerName: string;
  productId: number;
  productName: string;
  defaultQuantity: number;
  quantity: number;
  unit: string;
  appliedPrice: number;
  status: 'UNMARKED' | 'DELIVERED' | 'SKIPPED' | 'NOT_DELIVERED';
  notes: string;
  isOverride?: boolean;
  overrideDiff?: string;
  isExtraProduct?: boolean;
  customerStartDate?: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  unit: string;
  defaultPrice: number;
  active: boolean;
}

interface CustomerGroup {
  customerId: number;
  customerName: string;
  mobileNumber?: string;
  address?: string;
  items: DeliveryItem[];
}

const getISTTodayDateString = () => {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).formatToParts(new Date());
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return `${year}-${month}-${day}`;
  } catch (e) {
    return format(new Date(), 'yyyy-MM-dd');
  }
};

export const Deliveries: React.FC = () => {
  const { authFetch } = useAuth();
  
  // Date & Session State (IST Timezone Asia/Kolkata)
  const [date, setDate] = useState<string>(getISTTodayDateString());
  // Deliveries & Products State
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'UNMARKED' | 'ADJUSTED'>('ALL');

  // Confirmation Modals State
  const [showMarkAllAbsentModal, setShowMarkAllAbsentModal] = useState(false);

  // Adjust Daily Product Override Modal State
  const [adjustCustomerGroup, setAdjustCustomerGroup] = useState<CustomerGroup | null>(null);
  const [adjustItems, setAdjustItems] = useState<DeliveryItem[]>([]);
  const [adjustNote, setAdjustNote] = useState<string>('');
  
  // Extra Product Selection State inside Adjust Modal
  const [selectedExtraProductId, setSelectedExtraProductId] = useState<number>(0);
  const [extraQty, setExtraQty] = useState<number>(1.0);

  // Customer Attendance Calendar History Modal State
  const [historyCustomerId, setHistoryCustomerId] = useState<number | null>(null);
  const [historyCustomerName, setHistoryCustomerName] = useState<string>('');
  const [historyMonth, setHistoryMonth] = useState<number>(new Date().getMonth() + 1);
  const [historyYear, setHistoryYear] = useState<number>(new Date().getFullYear());
  const [historyData, setHistoryData] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<any>(null);

  // Fetch product catalog
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await authFetch('/products');
        if (response.ok) {
          const data = await response.json();
          setProductsList(data);
          if (data.length > 0) {
            setSelectedExtraProductId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading products list:', err);
      }
    };
    fetchProducts();
  }, []);

  const fetchDeliverySheet = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await authFetch(`/deliveries/sheet?date=${date}`);
      if (response.ok) {
        const data = await response.json();
        setDeliveries(data);
      } else {
        setDeliveries([]);
      }
    } catch (error) {
      console.error('Error fetching delivery sheet:', error);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliverySheet();
  }, [date]);

  // Date Navigation Handlers
  const handlePrevDay = () => {
    const parsed = parseISO(date);
    if (isValid(parsed)) {
      setDate(format(subDays(parsed, 1), 'yyyy-MM-dd'));
    }
  };

  const handleNextDay = () => {
    const parsed = parseISO(date);
    if (isValid(parsed)) {
      setDate(format(addDays(parsed, 1), 'yyyy-MM-dd'));
    }
  };

  const handleToday = () => {
    setDate(format(new Date(), 'yyyy-MM-dd'));
  };

  // Group deliveries by Customer
  const customerGroups: CustomerGroup[] = React.useMemo(() => {
    const map = new Map<number, CustomerGroup>();
    for (const d of deliveries) {
      // Hide customer completely if selected delivery date is prior to customer creation date
      if (d.customerStartDate && date < d.customerStartDate) {
        continue;
      }
      if (!map.has(d.customerId)) {
        map.set(d.customerId, {
          customerId: d.customerId,
          customerName: d.customerName,
          items: []
        });
      }
      map.get(d.customerId)!.items.push(d);
    }
    return Array.from(map.values());
  }, [deliveries, date]);

  // Compute Overall Attendance Metrics
  const totalCustomersCount = customerGroups.length;
  
  const presentCustomersCount = customerGroups.filter(g => 
    g.items.some(i => i.status === 'DELIVERED')
  ).length;

  const absentCustomersCount = customerGroups.filter(g => 
    g.items.every(i => i.status === 'SKIPPED' || i.status === 'NOT_DELIVERED')
  ).length;

  const unmarkedCustomersCount = customerGroups.filter(g => 
    g.items.every(i => i.status === 'UNMARKED')
  ).length;

  const markedCount = totalCustomersCount - unmarkedCustomersCount;
  const completionPercentage = totalCustomersCount > 0 
    ? Math.round((markedCount / totalCustomersCount) * 100) 
    : 0;

  // Filtered Customer Groups
  const filteredGroups = customerGroups.filter(group => {
    // Search query matching
    const matchesSearch = group.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // Status filter matching
    if (statusFilter === 'ALL') return true;

    const isPresent = group.items.some(i => i.status === 'DELIVERED');
    const isAbsent = group.items.every(i => i.status === 'SKIPPED' || i.status === 'NOT_DELIVERED');
    const isUnmarked = group.items.every(i => i.status === 'UNMARKED');
    const isAdjusted = group.items.some(i => i.isOverride || i.isExtraProduct);

    if (statusFilter === 'PRESENT') return isPresent;
    if (statusFilter === 'ABSENT') return isAbsent;
    if (statusFilter === 'UNMARKED') return isUnmarked;
    if (statusFilter === 'ADJUSTED') return isAdjusted;

    return true;
  });

  // Individual Customer Attendance Toggle (1-click)
  const handleToggleCustomerStatus = (customerId: number, newStatus: 'DELIVERED' | 'SKIPPED') => {
    setDeliveries(prev => prev.map(item => {
      if (item.customerId === customerId) {
        if (newStatus === 'SKIPPED') {
          return {
            ...item,
            status: 'SKIPPED',
            quantity: 0,
            isOverride: false,
            overrideDiff: undefined
          };
        } else {
          // Restore default regular quantity
          const restoredQty = item.defaultQuantity > 0 ? item.defaultQuantity : 1.0;
          return {
            ...item,
            status: 'DELIVERED',
            quantity: restoredQty,
            isOverride: false,
            overrideDiff: undefined
          };
        }
      }
      return item;
    }));
  };

  // Bulk Actions: Mark All Present (1-click Idempotent)
  const handleMarkAllPresent = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await authFetch(`/deliveries/mark-all-present?date=${date}`, {
        method: 'POST'
      });
      if (response.ok) {
        setMessage({ type: 'success', text: `All customers marked PRESENT with default regular plans for ${date}!` });
        fetchDeliverySheet();
      } else {
        // Fallback local update
        setDeliveries(prev => prev.map(item => ({
          ...item,
          status: 'DELIVERED',
          quantity: item.defaultQuantity > 0 ? item.defaultQuantity : 1.0
        })));
        setMessage({ type: 'success', text: 'Marked all customers PRESENT locally.' });
      }
    } catch (err) {
      setDeliveries(prev => prev.map(item => ({
        ...item,
        status: 'DELIVERED',
        quantity: item.defaultQuantity > 0 ? item.defaultQuantity : 1.0
      })));
      setMessage({ type: 'success', text: 'Marked all customers PRESENT.' });
    } finally {
      setLoading(false);
    }
  };

  // Bulk Actions: Mark All Absent
  const handleConfirmMarkAllAbsent = async () => {
    setShowMarkAllAbsentModal(false);
    setLoading(true);
    setMessage(null);
    try {
      const response = await authFetch(`/deliveries/mark-all-absent?date=${date}`, {
        method: 'POST'
      });
      if (response.ok) {
        setMessage({ type: 'error', text: `All customers marked ABSENT for ${date}. Billed quantity set to 0.` });
        fetchDeliverySheet();
      } else {
        setDeliveries(prev => prev.map(item => ({
          ...item,
          status: 'SKIPPED',
          quantity: 0
        })));
        setMessage({ type: 'error', text: 'Marked all customers ABSENT locally.' });
      }
    } catch (err) {
      setDeliveries(prev => prev.map(item => ({
        ...item,
        status: 'SKIPPED',
        quantity: 0
      })));
      setMessage({ type: 'error', text: 'Marked all customers ABSENT.' });
    } finally {
      setLoading(false);
    }
  };

  // Open Daily Product Override Modal ("Adjust")
  const handleOpenAdjustModal = (group: CustomerGroup) => {
    setAdjustCustomerGroup(group);
    setAdjustItems(JSON.parse(JSON.stringify(group.items)));
    setAdjustNote(group.items[0]?.notes || '');
  };

  // Update quantity inside Adjust Modal
  const handleAdjustItemQtyChange = (productId: number, newQty: number) => {
    setAdjustItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const qty = Math.max(0, parseFloat(newQty.toFixed(2)));
        const defaultQty = item.defaultQuantity;
        const diffNum = qty - defaultQty;
        const isOv = (qty !== defaultQty);
        let diffStr: string | undefined = undefined;
        if (isOv) {
          diffStr = diffNum > 0 ? `+${diffNum.toFixed(1)} ${item.unit}` : `${diffNum.toFixed(1)} ${item.unit}`;
        }
        return {
          ...item,
          quantity: qty,
          status: qty === 0 ? 'SKIPPED' : 'DELIVERED',
          isOverride: isOv,
          overrideDiff: diffStr
        };
      }
      return item;
    }));
  };

  // Reset Adjust items to Regular Default Plan
  const handleResetAdjustToRegular = () => {
    setAdjustItems(prev => prev.map(item => ({
      ...item,
      quantity: item.defaultQuantity,
      status: item.defaultQuantity > 0 ? 'DELIVERED' : 'UNMARKED',
      isOverride: false,
      overrideDiff: undefined
    })));
  };

  // Add Extra Product inside Adjust Modal
  const handleAddExtraProductInAdjust = () => {
    if (!adjustCustomerGroup || !selectedExtraProductId) return;
    const prod = productsList.find(p => p.id === selectedExtraProductId);
    if (!prod) return;

    // Check if already in adjustItems
    const exists = adjustItems.some(i => i.productId === selectedExtraProductId);
    if (exists) {
      handleAdjustItemQtyChange(selectedExtraProductId, (adjustItems.find(i => i.productId === selectedExtraProductId)?.quantity || 0) + extraQty);
      return;
    }

    const newItem: DeliveryItem = {
      customerId: adjustCustomerGroup.customerId,
      customerName: adjustCustomerGroup.customerName,
      productId: prod.id,
      productName: prod.name,
      defaultQuantity: 0,
      quantity: extraQty,
      unit: prod.unit,
      appliedPrice: prod.defaultPrice,
      status: 'DELIVERED',
      notes: adjustNote || 'Extra Product Demand',
      isExtraProduct: true,
      isOverride: true,
      overrideDiff: `+${extraQty} ${prod.unit}`
    };

    setAdjustItems(prev => [...prev, newItem]);
  };

  // Save Adjust Modal Changes
  const handleSaveAdjustModal = () => {
    if (!adjustCustomerGroup) return;

    setDeliveries(prev => {
      // Remove old items for customer
      const filtered = prev.filter(d => d.customerId !== adjustCustomerGroup.customerId);
      // Append adjusted items with note
      const updatedAdjusted = adjustItems.map(item => ({
        ...item,
        notes: adjustNote
      }));
      return [...filtered, ...updatedAdjusted];
    });

    setAdjustCustomerGroup(null);
    setMessage({ type: 'success', text: `Updated today's delivery override for ${adjustCustomerGroup.customerName}!` });
    setTimeout(() => setMessage(null), 3000);
  };

  // Global Save All Deliveries
  const handleSaveAllDeliveries = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await authFetch('/deliveries/bulk', {
        method: 'POST',
        body: JSON.stringify(deliveries.map(d => ({
          ...d,
          deliveryDate: date,
          session: 'DAILY'
        })))
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Saved all delivery & attendance logs for ${date}!` });
      } else {
        setMessage({ type: 'error', text: 'Backend database save failed. Saved locally.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network connection offline. Deliveries saved locally.' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Customer History Calendar Data
  const handleOpenHistoryModal = async (customerId: number, customerName: string) => {
    setHistoryCustomerId(customerId);
    setHistoryCustomerName(customerName);
    setSelectedCalendarDay(null);
    fetchHistoryData(customerId, historyYear, historyMonth);
  };

  const fetchHistoryData = async (customerId: number, yr: number, mo: number) => {
    setHistoryLoading(true);
    try {
      const response = await authFetch(`/deliveries/customer-history/${customerId}?year=${yr}&month=${mo}`);
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
      } else {
        setHistoryData(null);
      }
    } catch (err) {
      console.error('Error fetching customer history calendar:', err);
      setHistoryData(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePrevHistoryMonth = () => {
    let newMo = historyMonth - 1;
    let newYr = historyYear;
    if (newMo < 1) {
      newMo = 12;
      newYr--;
    }
    setHistoryMonth(newMo);
    setHistoryYear(newYr);
    if (historyCustomerId) fetchHistoryData(historyCustomerId, newYr, newMo);
  };

  const handleNextHistoryMonth = () => {
    let newMo = historyMonth + 1;
    let newYr = historyYear;
    if (newMo > 12) {
      newMo = 1;
      newYr++;
    }
    setHistoryMonth(newMo);
    setHistoryYear(newYr);
    if (historyCustomerId) fetchHistoryData(historyCustomerId, newYr, newMo);
  };

  const displayDateObj = parseISO(date);
  const formattedDisplayDate = isValid(displayDateObj) 
    ? format(displayDateObj, 'EEEE, dd MMMM yyyy')
    : date;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      
      {/* 1. TOP HEADER & INTERACTIVE DATE NAVIGATOR */}
      <div className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary-text)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <Truck size={26} style={{ color: 'var(--primary-green)' }} />
              <span>Daily Delivery & Attendance</span>
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--secondary-text)', marginTop: '4px', margin: 0 }}>
              Mark daily customer attendance, adjust daily product quantities, and view attendance history
            </p>
          </div>
        </div>

        {/* Date Navigator Strip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: 'rgba(74, 186, 126, 0.08)',
          borderRadius: '12px',
          border: '1px solid rgba(74, 186, 126, 0.2)'
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={handlePrevDay} 
              title="Previous Day"
              style={{
                padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)',
                background: 'var(--white)', cursor: 'pointer', display: 'flex', alignItems: 'center'
              }}
            >
              <ChevronLeft size={18} />
            </button>

            <button 
              onClick={handleToday}
              style={{
                padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--primary-green)',
                background: 'var(--primary-green)', color: '#fff', fontSize: '12px', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <RotateCcw size={14} />
              <span>Today</span>
            </button>

            <button 
              onClick={handleNextDay} 
              title="Next Day"
              style={{
                padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)',
                background: 'var(--white)', cursor: 'pointer', display: 'flex', alignItems: 'center'
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarIcon size={20} style={{ color: 'var(--primary-green)' }} />
            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary-text)' }}>
              {formattedDisplayDate}
            </span>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              style={{ 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px', 
                padding: '6px 10px', 
                fontSize: '13px', 
                outline: 'none',
                cursor: 'pointer',
                background: 'var(--white)',
                fontWeight: 600
              }} 
            />
          </div>

        </div>

        {/* 2. TOP SUMMARY METRICS CARDS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px'
        }}>
          <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-card-subtle, rgba(0,0,0,0.03))', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', color: 'var(--secondary-text)', fontWeight: 600, textTransform: 'uppercase' }}>Total Expected</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-text)', marginTop: '2px' }}>{totalCustomersCount}</div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: '#D1FAE5', border: '1px solid #A7F3D0' }}>
            <div style={{ fontSize: '11px', color: '#065F46', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <UserCheck size={13} /> Present
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#065F46', marginTop: '2px' }}>{presentCustomersCount}</div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5' }}>
            <div style={{ fontSize: '11px', color: '#991B1B', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <UserX size={13} /> Absent
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#991B1B', marginTop: '2px' }}>{absentCustomersCount}</div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
            <div style={{ fontSize: '11px', color: '#92400E', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <HelpCircle size={13} /> Unmarked
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#92400E', marginTop: '2px' }}>{unmarkedCustomersCount}</div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>Completion</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e40af', marginTop: '2px' }}>{completionPercentage}%</div>
          </div>
        </div>

      </div>

      {/* 3. PRIMARY BULK ACTIONS TOOLBAR */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '14px 18px',
        backgroundColor: 'var(--white)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} style={{ color: 'var(--primary-green)' }} />
          <span>Quick Route Actions:</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleMarkAllPresent}
            disabled={loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: '10px', border: 'none',
              backgroundColor: 'var(--primary-green)', color: '#fff', fontSize: '13px', fontWeight: 800,
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(74, 186, 126, 0.3)'
            }}
          >
            <UserCheck size={16} />
            <span>✓ Mark All Present</span>
          </button>

          <button 
            onClick={() => setShowMarkAllAbsentModal(true)}
            disabled={loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: '10px', border: '1px solid #FCA5A5',
              backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '13px', fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <UserX size={16} />
            <span>✕ Mark All Absent</span>
          </button>
        </div>
      </div>

      {/* 4. SEARCH & FILTER PILLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary-text)' }} />
          <input 
            type="text"
            placeholder="Search customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px 10px 36px', borderRadius: '10px',
              border: '1px solid var(--border-color)', background: 'var(--white)',
              fontSize: '13px', outline: 'none'
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { id: 'ALL', label: `All (${customerGroups.length})` },
            { id: 'PRESENT', label: `Present (${presentCustomersCount})` },
            { id: 'ABSENT', label: `Absent (${absentCustomersCount})` },
            { id: 'UNMARKED', label: `Unmarked (${unmarkedCustomersCount})` },
            { id: 'ADJUSTED', label: `Needs Attention (Adjusted)` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as any)}
              style={{
                padding: '8px 14px', borderRadius: '8px',
                fontSize: '12px', fontWeight: statusFilter === f.id ? 800 : 500,
                backgroundColor: statusFilter === f.id ? 'var(--primary-green)' : 'var(--white)',
                color: statusFilter === f.id ? '#fff' : 'var(--secondary-text)',
                cursor: 'pointer', border: '1px solid var(--border-color)', whiteSpace: 'nowrap'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification Banner */}
      {message && (
        <div style={{
          backgroundColor: message.type === 'success' ? '#D1FAE5' : '#FEE2E2',
          border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FCA5A5'}`,
          color: message.type === 'success' ? '#065F46' : '#991B1B',
          padding: '12px 16px', borderRadius: '10px',
          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 600
        }}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR MARK ALL ABSENT */}
      {showMarkAllAbsentModal && (
        <div style={{
          backgroundColor: '#FEF2F2', border: '2px solid #FCA5A5', borderRadius: '14px',
          padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={24} style={{ color: '#DC2626' }} />
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#991B1B', margin: 0 }}>
              Mark All Customers ABSENT for {formattedDisplayDate}?
            </h4>
          </div>
          <p style={{ fontSize: '13px', color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
            All <strong>{totalCustomersCount} customers</strong> scheduled for this date will be marked ABSENT with <strong>0 delivered quantity</strong> (₹0.00 billed). This will not alter their regular delivery plans for future dates.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button 
              type="button" 
              onClick={() => setShowMarkAllAbsentModal(false)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleConfirmMarkAllAbsent}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: '13px' }}
            >
              Yes, Mark All Absent
            </button>
          </div>
        </div>
      )}

      {/* 5. CUSTOMER DELIVERY SHEET & ATTENDANCE CARDS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--secondary-text)', fontSize: '14px', fontWeight: 600 }}>
            Loading delivery & attendance sheet for {formattedDisplayDate}...
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--secondary-text)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-text)', margin: 0 }}>
              {customerGroups.length === 0 ? 'No active customer subscriptions found for this delivery sheet.' : 'No customers match your search or filter.'}
            </p>
            {customerGroups.length === 0 && (
              <Link to="/customers" className="btn-primary" style={{ marginTop: '4px', padding: '10px 20px', fontSize: '13px', textDecoration: 'none', fontWeight: 700 }}>
                Go to Customers Section to Add Customers
              </Link>
            )}
          </div>
        ) : (
          filteredGroups.map((group, index) => {
            const isPresent = group.items.some(i => i.status === 'DELIVERED');
            const isAbsent = group.items.every(i => i.status === 'SKIPPED' || i.status === 'NOT_DELIVERED');
            const isUnmarked = group.items.every(i => i.status === 'UNMARKED');
            const hasOverride = group.items.some(i => i.isOverride || i.isExtraProduct);

            // Compute regular plan summary text
            const regularPlanSummary = group.items
              .map(i => `${i.productName} ${i.defaultQuantity > 0 ? i.defaultQuantity : ''}${i.unit}`)
              .join(' + ');

            // Compute today's actual delivery summary text
            const actualDeliverySummary = group.items
              .filter(i => i.status === 'DELIVERED')
              .map(i => `${i.productName} ${i.quantity}${i.unit}`)
              .join(' + ');

            return (
              <div 
                key={group.customerId} 
                className="card" 
                style={{ 
                  padding: '16px 18px',
                  borderLeft: isPresent ? '5px solid var(--primary-green)' : (isAbsent ? '5px solid #ef5350' : '5px solid #d1d5db'),
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  backgroundColor: hasOverride ? 'rgba(245, 158, 11, 0.03)' : undefined
                }}
              >
                
                {/* Main Row Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Index Badge */}
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      backgroundColor: isPresent ? '#D1FAE5' : (isAbsent ? '#FEE2E2' : '#F3F4F6'),
                      color: isPresent ? '#065F46' : (isAbsent ? '#991B1B' : '#4B5563'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '13px'
                    }}>
                      #{index + 1}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary-text)', margin: 0 }}>
                          {group.customerName}
                        </h4>

                        {/* Daily Override Badge */}
                        {hasOverride && (
                          <span style={{
                            padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 800,
                            backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A'
                          }}>
                            ⚡ ADJUSTED OVERRIDE
                          </span>
                        )}
                      </div>

                      {/* Products Summary */}
                      <div style={{ fontSize: '13px', color: 'var(--secondary-text)', marginTop: '2px', margin: 0 }}>
                        <span>Regular Plan: <strong>{regularPlanSummary}</strong></span>
                        {hasOverride && isPresent && (
                          <span style={{ color: '#b45309', marginLeft: '8px', fontWeight: 700 }}>
                            (Today: {actualDeliverySummary})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800,
                      backgroundColor: isPresent ? '#D1FAE5' : (isAbsent ? '#FEE2E2' : '#F3F4F6'),
                      color: isPresent ? '#065F46' : (isAbsent ? '#991B1B' : '#4B5563')
                    }}>
                      {isPresent && <><CheckCircle size={14} /> <span>Present</span></>}
                      {isAbsent && <><UserX size={14} /> <span>Absent</span></>}
                      {isUnmarked && <><HelpCircle size={14} /> <span>Unmarked</span></>}
                    </div>
                  </div>

                </div>

                {/* 1-Touch Attendance & Action Control Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  
                  {/* Attendance Controls */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="button"
                      onClick={() => handleToggleCustomerStatus(group.customerId, 'DELIVERED')}
                      style={{
                        padding: '8px 16px', borderRadius: '8px',
                        border: isPresent ? '2px solid var(--primary-green)' : '1px solid var(--border-color)',
                        backgroundColor: isPresent ? 'var(--primary-green)' : 'var(--white)',
                        color: isPresent ? '#fff' : 'var(--secondary-text)',
                        fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <UserCheck size={15} />
                      <span>✓ Present</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => handleToggleCustomerStatus(group.customerId, 'SKIPPED')}
                      style={{
                        padding: '8px 16px', borderRadius: '8px',
                        border: isAbsent ? '2px solid #ef5350' : '1px solid var(--border-color)',
                        backgroundColor: isAbsent ? '#ef5350' : 'var(--white)',
                        color: isAbsent ? '#fff' : 'var(--secondary-text)',
                        fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <UserX size={15} />
                      <span>✕ Absent</span>
                    </button>
                  </div>

                  {/* Adjust & History Buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="button"
                      onClick={() => handleOpenAdjustModal(group)}
                      style={{
                        padding: '8px 14px', borderRadius: '8px',
                        border: hasOverride ? '1px solid #f59e0b' : '1px solid var(--border-color)',
                        backgroundColor: hasOverride ? '#fef3c7' : 'var(--white)',
                        color: hasOverride ? '#92400e' : 'var(--primary-text)',
                        fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <Edit3 size={14} />
                      <span>Adjust ({hasOverride ? 'Override Active' : 'Daily Change'})</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => handleOpenHistoryModal(group.customerId, group.customerName)}
                      style={{
                        padding: '8px 14px', borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--white)',
                        color: 'var(--primary-text)',
                        fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <HistoryIcon size={14} />
                      <span>History</span>
                    </button>
                  </div>

                </div>

              </div>
            );
          })
        )}

      </div>

      {/* 6. DAILY PRODUCT OVERRIDE MODAL ("ADJUST") */}
      {adjustCustomerGroup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '16px'
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto',
            padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px',
            backgroundColor: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--primary-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Edit3 size={20} style={{ color: 'var(--primary-green)' }} />
                  <span>Adjust Today's Delivery</span>
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--secondary-text)', marginTop: '4px', margin: 0 }}>
                  Customer: <strong>{adjustCustomerGroup.customerName}</strong> &bull; {formattedDisplayDate}
                </p>
              </div>
              <X size={20} style={{ cursor: 'pointer', color: 'var(--secondary-text)' }} onClick={() => setAdjustCustomerGroup(null)} />
            </div>

            <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', color: '#92400E', fontWeight: 600 }}>
              💡 <strong>Note:</strong> Changes made here apply <strong>ONLY to {date}</strong> and will NOT alter the customer's regular default delivery plan for tomorrow.
            </div>

            {/* Products Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Scheduled Products Breakdown:</span>
                <span style={{ fontSize: '12px', color: 'var(--primary-green)', fontWeight: 700 }}>
                  Est. Daily Total: ₹{adjustItems.reduce((sum, it) => sum + (it.quantity * (it.appliedPrice ?? 0)), 0).toFixed(2)}
                </span>
              </div>
              
              {adjustItems.map(item => {
                const diffVal = item.quantity - item.defaultQuantity;
                const isOver = diffVal !== 0;
                const price = item.appliedPrice ?? 0;
                const lineTotal = item.quantity * price;

                return (
                  <div key={item.productId} style={{
                    padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-card-subtle, #f9fafb)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
                  }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-text)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span>{item.productName}</span>
                        <span style={{
                          fontSize: '12px', fontWeight: 800, color: 'var(--primary-green)',
                          backgroundColor: '#D1FAE5', padding: '2px 8px', borderRadius: '6px',
                          border: '1px solid #A7F3D0'
                        }}>
                          Price: ₹{price.toFixed(2)} / {item.unit}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--secondary-text)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span>Regular Plan: <strong>{item.defaultQuantity} {item.unit}</strong></span>
                        <span>&bull;</span>
                        <span style={{ color: 'var(--primary-text)', fontWeight: 600 }}>
                          Subtotal: <strong>₹{lineTotal.toFixed(2)}</strong>
                        </span>
                      </div>

                      {/* QUICK QUANTITY PRESETS (0.25, 0.5, 0.75, 1, 1.5, 2, 3) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed var(--border-color)' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--secondary-text)' }}>Quick Qty:</span>
                        {[0, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0].map(q => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => handleAdjustItemQtyChange(item.productId, q)}
                            style={{
                              padding: '3px 8px', borderRadius: '6px',
                              border: item.quantity === q ? '1px solid var(--primary-green)' : '1px solid var(--border-color)',
                              backgroundColor: item.quantity === q ? 'var(--primary-green)' : '#fff',
                              color: item.quantity === q ? '#fff' : 'var(--primary-text)',
                              fontSize: '11px', fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            {q === 0 ? '0 (Skip)' : `${q} ${item.unit}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <label style={{ fontSize: '10px', color: 'var(--secondary-text)', fontWeight: 700 }}>TODAY QTY ({item.unit})</label>
                        <input 
                          type="number" step="0.1" min="0"
                          value={item.quantity}
                          onChange={(e) => handleAdjustItemQtyChange(item.productId, parseFloat(e.target.value) || 0)}
                          style={{
                            width: '75px', textAlign: 'center', padding: '6px', borderRadius: '8px',
                            border: '1px solid var(--border-color)', fontWeight: 800, fontSize: '14px',
                            background: '#fff'
                          }}
                        />
                      </div>

                      {isOver && (
                        <span style={{ fontSize: '12px', fontWeight: 800, color: diffVal > 0 ? 'var(--primary-green)' : '#dc2626' }}>
                          {diffVal > 0 ? `+${diffVal.toFixed(1)} ${item.unit}` : `${diffVal.toFixed(1)} ${item.unit}`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Inline Add One-Time Extra Product */}
            <div style={{
              padding: '12px 14px', borderRadius: '10px', border: '1px dashed var(--primary-green)',
              backgroundColor: 'rgba(74, 186, 126, 0.05)', display: 'flex', flexDirection: 'column', gap: '10px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PackagePlus size={15} />
                <span>+ Add Extra Product Demand (One-Day Only)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
                <select 
                  className="form-input"
                  value={selectedExtraProductId}
                  onChange={(e) => setSelectedExtraProductId(Number(e.target.value))}
                  style={{ background: '#fff', fontSize: '12px', padding: '6px 8px' }}
                >
                  {productsList.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.unit}) — ₹{p.defaultPrice}</option>
                  ))}
                </select>

                <input 
                  type="number" step="0.1" min="0.1" className="form-input"
                  value={extraQty} onChange={(e) => setExtraQty(Number(e.target.value))}
                  placeholder="Qty" style={{ background: '#fff', fontSize: '12px', padding: '6px 8px' }}
                />

                <button 
                  type="button"
                  onClick={handleAddExtraProductInAdjust}
                  style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: 'var(--primary-green)', color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                >
                  Add
                </button>
              </div>

              {/* Quick Preset Buttons for Extra Product Qty */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--secondary-text)' }}>Quick Qty Presets:</span>
                {[0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setExtraQty(q)}
                    style={{
                      padding: '3px 8px', borderRadius: '6px',
                      border: extraQty === q ? '1px solid var(--primary-green)' : '1px solid var(--border-color)',
                      backgroundColor: extraQty === q ? 'var(--primary-green)' : '#fff',
                      color: extraQty === q ? '#fff' : 'var(--primary-text)',
                      fontSize: '11px', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {q} L
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Note Input */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Optional Note / Reason</label>
              <input 
                type="text" className="form-input"
                placeholder="e.g. Requested extra milk for guests, or family out of town"
                value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)}
                style={{ background: '#fff' }}
              />
            </div>

            {/* Modal Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <button 
                type="button"
                onClick={handleResetAdjustToRegular}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#fff', color: 'var(--secondary-text)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                Reset to Regular Plan
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" onClick={() => setAdjustCustomerGroup(null)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="button" onClick={handleSaveAdjustModal}
                  className="btn-primary"
                  style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 800 }}
                >
                  Save Override
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 7. CUSTOMER ATTENDANCE CALENDAR HISTORY MODAL ("HISTORY") */}
      {historyCustomerId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '16px'
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto',
            padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px',
            backgroundColor: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            
            {/* Calendar Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--primary-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HistoryIcon size={20} style={{ color: 'var(--primary-green)' }} />
                  <span>Attendance History Calendar</span>
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--secondary-text)', marginTop: '4px', margin: 0 }}>
                  Customer: <strong>{historyCustomerName}</strong>
                </p>
              </div>
              <X size={20} style={{ cursor: 'pointer', color: 'var(--secondary-text)' }} onClick={() => setHistoryCustomerId(null)} />
            </div>

            {/* Month Switcher */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card-subtle, #f9fafb)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <button onClick={handlePrevHistoryMonth} style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#fff', cursor: 'pointer' }}>
                <ChevronLeft size={16} />
              </button>

              <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-text)' }}>
                {format(new Date(historyYear, historyMonth - 1, 1), 'MMMM yyyy')}
              </span>

              <button onClick={handleNextHistoryMonth} style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#fff', cursor: 'pointer' }}>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Monthly Summary Cards */}
            {historyData && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#D1FAE5', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#065F46', fontWeight: 800 }}>PRESENT</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#065F46' }}>{historyData.presentDays} days</div>
                </div>

                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#FEE2E2', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#991B1B', fontWeight: 800 }}>ABSENT</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#991B1B' }}>{historyData.absentDays} days</div>
                </div>

                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#FEF3C7', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#92400E', fontWeight: 800 }}>ADJUSTED</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#92400E' }}>{historyData.adjustedDays} days</div>
                </div>

                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#1e40af', fontWeight: 800 }}>TOTAL QUANTITY</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e40af' }}>🥛 {historyData.totalMonthVolume} L</div>
                </div>
              </div>
            )}

            {/* Calendar Legend */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
              <span style={{ color: '#065F46', display: 'flex', alignItems: 'center', gap: '4px' }}>🟢 Present</span>
              <span style={{ color: '#991B1B', display: 'flex', alignItems: 'center', gap: '4px' }}>🔴 Absent</span>
              <span style={{ color: '#92400E', display: 'flex', alignItems: 'center', gap: '4px' }}>🟡 Adjusted</span>
              <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>⚪ No Record</span>
            </div>

            {/* Calendar Grid View */}
            {historyLoading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--secondary-text)' }}>Loading calendar...</div>
            ) : (
              (() => {
                const daysInMo = new Date(historyYear, historyMonth, 0).getDate();
                const firstDayIdx = new Date(historyYear, historyMonth - 1, 1).getDay(); // 0 = Sun
                const weekHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                const dayRecordsMap = new Map<number, any>();
                if (historyData && historyData.days) {
                  for (const d of historyData.days) {
                    const dtNum = parseInt(d.date.split('-')[2]);
                    dayRecordsMap.set(dtNum, d);
                  }
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Weekday Header Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--secondary-text)' }}>
                      {weekHeaders.map(w => <div key={w}>{w}</div>)}
                    </div>

                    {/* Month Days Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                      {/* Blank offset cells */}
                      {Array.from({ length: firstDayIdx }).map((_, i) => (
                        <div key={`offset-${i}`} style={{ padding: '10px', height: '48px' }} />
                      ))}

                      {/* Days 1 to N */}
                      {Array.from({ length: daysInMo }).map((_, i) => {
                        const dayNum = i + 1;
                        const rec = dayRecordsMap.get(dayNum);
                        const isPres = rec && rec.status === 'PRESENT';
                        const isAbs = rec && rec.status === 'ABSENT';

                        let bgColor = '#F3F4F6';
                        let textColor = '#4B5563';
                        let borderColor = 'transparent';

                        if (isPres) {
                          bgColor = '#D1FAE5';
                          textColor = '#065F46';
                          borderColor = '#A7F3D0';
                        } else if (isAbs) {
                          bgColor = '#FEE2E2';
                          textColor = '#991B1B';
                          borderColor = '#FCA5A5';
                        }

                        return (
                          <div 
                            key={dayNum}
                            onClick={() => setSelectedCalendarDay(rec || { date: `${historyYear}-${String(historyMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`, status: 'NO_RECORD', items: [] })}
                            style={{
                              height: '48px', borderRadius: '8px', border: `1px solid ${borderColor}`,
                              backgroundColor: bgColor, color: textColor, cursor: 'pointer',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 800, fontSize: '12px', transition: 'all 0.15s'
                            }}
                          >
                            <span>{dayNum}</span>
                            {rec && rec.dayVolume > 0 ? (
                              <span style={{ fontSize: '9px', fontWeight: 800, marginTop: '2px' }}>🥛 {rec.dayVolume} L</span>
                            ) : rec && isAbs ? (
                              <span style={{ fontSize: '9px', fontWeight: 700, marginTop: '2px', color: '#991B1B' }}>0 L</span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            )}

            {/* Selected Day Log Popover Detail */}
            {selectedCalendarDay && (
              <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card-subtle, #f9fafb)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '13px' }}>
                  <span>Day Log: {selectedCalendarDay.date}</span>
                  <span style={{ color: selectedCalendarDay.status === 'PRESENT' ? 'var(--primary-green)' : (selectedCalendarDay.status === 'ABSENT' ? '#dc2626' : 'var(--secondary-text)') }}>
                    Status: {selectedCalendarDay.status}
                  </span>
                </div>

                {selectedCalendarDay.items && selectedCalendarDay.items.length > 0 ? (
                  selectedCalendarDay.items.map((it: any, idx: number) => (
                    <div key={idx} style={{ fontSize: '12px', color: 'var(--primary-text)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{it.productName}: <strong>{it.quantity} {it.unit}</strong> @ ₹{it.appliedPrice}</span>
                      <span>Total: ₹{it.totalAmount}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--secondary-text)' }}>No specific items logged for this date.</div>
                )}
              </div>
            )}

            {/* Close Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button 
                type="button" 
                onClick={() => setHistoryCustomerId(null)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              >
                Close Calendar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 8. FLOATING STICKY SAVE BUTTON */}
      <button 
        onClick={handleSaveAllDeliveries} 
        className="btn-primary sticky-bottom-btn" 
        disabled={loading}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          padding: '14px 28px', fontSize: '15px', fontWeight: 800, borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(74, 186, 126, 0.4)'
        }}
      >
        <Save size={20} />
        <span>{loading ? 'Saving Delivery Sheet...' : 'Save All Deliveries'}</span>
      </button>

    </div>
  );
};
