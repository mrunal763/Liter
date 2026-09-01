import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Calendar, FileText, Filter, TrendingUp, DollarSign, 
  Users, Package, ShoppingBag, Award, ArrowUpRight, CheckCircle2, ChevronRight, X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';

interface ProductOption {
  id: number;
  name: string;
  category: string;
  unit: string;
  defaultPrice?: number;
}

interface CustomerOption {
  id: number;
  name: string;
  mobileNumber?: string;
}

interface ProductSummary {
  id: number;
  productName: string;
  category: string;
  unit: string;
  quantitySold: number;
  averagePrice: number;
  totalRevenue: number;
  percentage: number;
}

interface CustomerSummary {
  id: number;
  customerName: string;
  mobileNumber: string;
  totalQuantity: number;
  totalAmount: number;
  transactionCount: number;
}

interface DayTrend {
  date: string;
  salesAmount: number;
  quantitySold: number;
  transactionCount: number;
}

interface MonthTrend {
  monthKey: string;
  monthName: string;
  salesAmount: number;
  quantitySold: number;
}

interface AnalyticsData {
  totalSales: number;
  totalQuantitySold: number;
  totalCustomersServed: number;
  totalTransactions: number;
  avgDailySales: number;
  highestSellingProduct: string;
  highestValueCustomer: string;
  productSales: ProductSummary[];
  customerSales: CustomerSummary[];
  dayWiseTrend: DayTrend[];
  monthlyTrend: MonthTrend[];
}

const PRESET_RANGES = [
  { label: 'Today', key: 'TODAY' },
  { label: 'This Week', key: 'THIS_WEEK' },
  { label: 'This Month', key: 'THIS_MONTH' },
  { label: 'Last Month', key: 'LAST_MONTH' },
  { label: 'Custom Range', key: 'CUSTOM' }
];

const DIVERSE_COLOR_PALETTE = [
  '#2563EB', // 1. Royal Blue
  '#D97706', // 2. Golden Amber
  '#7C3AED', // 3. Deep Violet
  '#0891B2', // 4. Bright Cyan
  '#EA580C', // 5. Fiery Orange
  '#C026D3', // 6. Vivid Magenta
  '#059669', // 7. Emerald Green
  '#E11D48', // 8. Crimson Rose
  '#0284C7', // 9. Sky Blue
  '#CA8A04', // 10. Deep Gold
  '#4F46E5', // 11. Indigo
  '#16A34A'  // 12. Leaf Green
];

const getProductColor = (pName: string, pCat: string, idx: number) => {
  // Always assign a distinct color per product item index so every product entry gets a unique color!
  return DIVERSE_COLOR_PALETTE[idx % DIVERSE_COLOR_PALETTE.length];
};

export const Reports: React.FC = () => {
  const { authFetch } = useAuth();

  // Filters State
  const [rangePreset, setRangePreset] = useState<string>('THIS_MONTH');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [historicalMonth, setHistoricalMonth] = useState<string>('');

  // Options Data
  const [productsList, setProductsList] = useState<ProductOption[]>([]);
  const [customersList, setCustomersList] = useState<CustomerOption[]>([]);

  // Analytics Report State
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Active Tab for Detailed Tables
  const [activeTableTab, setActiveTableTab] = useState<'products' | 'customers' | 'daywise'>('products');

  // Fetch Products & Customers options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          authFetch('/products'),
          authFetch('/customers')
        ]);
        if (pRes.ok) setProductsList(await pRes.json());
        if (cRes.ok) setCustomersList(await cRes.json());
      } catch (e) {
        console.error('Error fetching filter options:', e);
      }
    };
    fetchOptions();
  }, []);

  // Handle Date Preset Changes
  const handlePresetSelect = (presetKey: string) => {
    setRangePreset(presetKey);
    setHistoricalMonth('');
    const today = new Date();

    if (presetKey === 'TODAY') {
      const todayStr = format(today, 'yyyy-MM-dd');
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (presetKey === 'THIS_WEEK') {
      setStartDate(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    } else if (presetKey === 'THIS_MONTH') {
      setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
    } else if (presetKey === 'LAST_MONTH') {
      const lastMonthDate = subMonths(today, 1);
      setStartDate(format(startOfMonth(lastMonthDate), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(lastMonthDate), 'yyyy-MM-dd'));
    }
  };

  // Handle Historical Month Select
  const handleHistoricalMonthSelect = (mKey: string) => {
    setHistoricalMonth(mKey);
    if (!mKey) return;
    setRangePreset('CUSTOM');
    const parts = mKey.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const targetDate = new Date(year, month, 1);
    setStartDate(format(startOfMonth(targetDate), 'yyyy-MM-dd'));
    setEndDate(format(endOfMonth(targetDate), 'yyyy-MM-dd'));
  };

  // Fetch Analytics API
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let url = `/reports/analytics?start=${startDate}&end=${endDate}`;
      if (selectedProductId !== 'ALL') url += `&productId=${selectedProductId}`;
      if (selectedCustomerId !== 'ALL') url += `&customerId=${selectedCustomerId}`;

      const response = await authFetch(url);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error('Error loading analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate, selectedProductId, selectedCustomerId]);

  // Generate 6 Month Historical Dropdown Options
  const getHistoricalMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const mDate = subMonths(now, i);
      const val = format(mDate, 'yyyy-MM');
      const label = format(mDate, 'MMMM yyyy');
      options.push({ val, label });
    }
    return options;
  };

  // Helper Calculations for Charts
  const dayTrends = analytics?.dayWiseTrend || [];
  const maxDaySales = Math.max(...dayTrends.map(d => d.salesAmount || 0), 100);

  const monthTrends = analytics?.monthlyTrend || [];
  const maxMonthSales = Math.max(...monthTrends.map(m => m.salesAmount || 0), 100);

  const productSales = analytics?.productSales || [];
  const totalProdRevenueSum = productSales.reduce((acc, p) => acc + (p.totalRevenue || 0), 0);

  const customerSales = analytics?.customerSales || [];
  const maxCustAmount = Math.max(...customerSales.map(c => c.totalAmount || 0), 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. HEADER & DASHBOARD TITLE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--primary-text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={24} style={{ color: 'var(--primary-green)' }} />
            <span>Sales & Analytics Dashboard</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--secondary-text)', marginTop: '4px', margin: 0 }}>
            Real-time business performance, product revenue, and customer purchasing trends
          </p>
        </div>
      </div>

      {/* 2. FLEXIBLE FILTERS CARD */}
      <div className="card" style={{ padding: '18px', backgroundColor: '#fff', borderLeft: '4px solid var(--primary-green)' }}>
        
        {/* Preset Range Selector Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', marginRight: '4px' }}>
            PERIOD PRESETS:
          </span>
          {PRESET_RANGES.map(p => (
            <button
              key={p.key}
              onClick={() => handlePresetSelect(p.key)}
              style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700,
                border: rangePreset === p.key ? 'none' : '1px solid var(--border-color)',
                backgroundColor: rangePreset === p.key ? 'var(--primary-green)' : '#F3F4F6',
                color: rangePreset === p.key ? '#fff' : 'var(--primary-text)',
                cursor: 'pointer', transition: 'all 0.2s ease'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Filters Controls Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          
          {/* Start Date */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
              START DATE
            </label>
            <input 
              type="date" className="form-input" 
              value={startDate} 
              onChange={(e) => { setStartDate(e.target.value); setRangePreset('CUSTOM'); setHistoricalMonth(''); }}
              style={{ background: '#fff', fontSize: '13px', fontWeight: 600 }}
            />
          </div>

          {/* End Date */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
              END DATE
            </label>
            <input 
              type="date" className="form-input" 
              value={endDate} 
              onChange={(e) => { setEndDate(e.target.value); setRangePreset('CUSTOM'); setHistoricalMonth(''); }}
              style={{ background: '#fff', fontSize: '13px', fontWeight: 600 }}
            />
          </div>

          {/* Product Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
              PRODUCT FILTER
            </label>
            <select
              className="form-input"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              style={{ background: '#fff', fontSize: '13px', fontWeight: 600 }}
            >
              <option value="ALL">📦 All Products ({productsList.length})</option>
              {productsList.map(p => (
                <option key={p.id} value={p.id}>
                  🥛 {p.name} ({p.unit}){p.defaultPrice ? ` — ₹${p.defaultPrice}/${p.unit}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
              CUSTOMER FILTER
            </label>
            <select
              className="form-input"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              style={{ background: '#fff', fontSize: '13px', fontWeight: 600 }}
            >
              <option value="ALL">👥 All Customers ({customersList.length})</option>
              {customersList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Historical Month Switcher */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary-green)' }}>
              📅 HISTORICAL MONTH
            </label>
            <select
              className="form-input"
              value={historicalMonth}
              onChange={(e) => handleHistoricalMonthSelect(e.target.value)}
              style={{ background: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46', fontSize: '13px', fontWeight: 700 }}
            >
              <option value="">Select Month History...</option>
              {getHistoricalMonthOptions().map(opt => (
                <option key={opt.val} value={opt.val}>{opt.label}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* 3. KEY SUMMARY CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        
        {/* Total Sales Card */}
        <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#065F46', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL SALES</span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#A7F3D0', color: '#047857' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#047857', marginTop: '10px' }}>
            ₹{(analytics?.totalSales || 0).toFixed(2)}
          </div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: 600 }}>
            Period: {startDate} to {endDate}
          </div>
        </div>

        {/* Total Quantity Sold Card */}
        <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#fff', border: '1px solid var(--border-color)', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--secondary-text)', fontWeight: 700, textTransform: 'uppercase' }}>VOLUME DELIVERED</span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#F3F4F6', color: 'var(--primary-text)' }}>
              <Package size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-text)', marginTop: '10px' }}>
            {(analytics?.totalQuantitySold || 0).toFixed(1)} <span style={{ fontSize: '14px', fontWeight: 600 }}>units</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--secondary-text)', marginTop: '4px' }}>
            Total product volume delivered
          </div>
        </div>

        {/* Customers Served Card */}
        <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#fff', border: '1px solid var(--border-color)', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--secondary-text)', fontWeight: 700, textTransform: 'uppercase' }}>CUSTOMERS SERVED</span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#F3F4F6', color: 'var(--primary-text)' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-text)', marginTop: '10px' }}>
            {analytics?.totalCustomersServed || 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--secondary-text)', marginTop: '4px' }}>
            Distinct active buyers in range
          </div>
        </div>

        {/* Total Transactions Card */}
        <div style={{ padding: '18px', borderRadius: '12px', backgroundColor: '#fff', border: '1px solid var(--border-color)', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--secondary-text)', fontWeight: 700, textTransform: 'uppercase' }}>TRANSACTIONS</span>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#F3F4F6', color: 'var(--primary-text)' }}>
              <ShoppingBag size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-text)', marginTop: '10px' }}>
            {analytics?.totalTransactions || 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--secondary-text)', marginTop: '4px' }}>
            Total completed daily deliveries
          </div>
        </div>

      </div>

      {/* 4. PERFORMANCE HIGHLIGHT METRICS BAR */}
      <div className="card" style={{ padding: '16px 20px', backgroundColor: '#F9FAFB', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--secondary-text)', fontWeight: 700, textTransform: 'uppercase' }}>HIGHEST-SELLING PRODUCT</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary-text)', marginTop: '2px' }}>
                {analytics?.highestSellingProduct || 'N/A'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#E0E7FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--secondary-text)', fontWeight: 700, textTransform: 'uppercase' }}>HIGHEST-VALUE CUSTOMER</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary-text)', marginTop: '2px' }}>
                {analytics?.highestValueCustomer || 'N/A'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--secondary-text)', fontWeight: 700, textTransform: 'uppercase' }}>AVERAGE DAILY SALES</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary-green)', marginTop: '2px' }}>
                ₹{(analytics?.avgDailySales || 0).toFixed(2)} / day
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 5. VISUAL CHARTS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        
        {/* CHART 1: PRODUCT SALES SHARE (DONUT/PIE CHART SVG) */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 14px 0', color: 'var(--primary-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📦 Product-Wise Sales Share</span>
          </h3>

          {productSales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--secondary-text)', fontSize: '13px' }}>
              No product delivery data recorded for this filter range.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Stacked Percentage Bar Visual with Distinct Product Colors */}
              <div style={{ width: '100%', height: '24px', borderRadius: '8px', overflow: 'hidden', display: 'flex', backgroundColor: '#E5E7EB' }}>
                {productSales.map((p, idx) => {
                  const pColor = getProductColor(p.productName, p.category, idx);

                  return (
                    <div
                      key={p.id}
                      title={`${p.productName} (${p.category}): ₹${p.totalRevenue.toFixed(2)} @ ₹${p.averagePrice.toFixed(2)}/${p.unit} (${p.percentage}%)`}
                      style={{
                        width: `${Math.max(p.percentage, 2)}%`,
                        backgroundColor: pColor,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  );
                })}
              </div>

              {/* Product Legend List with Price Rate & Milk Type */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                {productSales.map((p, idx) => {
                  const pColor = getProductColor(p.productName, p.category, idx);

                  return (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '10px 12px', borderRadius: '10px', backgroundColor: '#F9FAFB', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: pColor, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--primary-text)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span>🥛 {p.productName}</span>
                            <span style={{ fontSize: '11px', color: '#047857', backgroundColor: '#D1FAE5', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                              Rate: ₹{p.averagePrice.toFixed(2)} / {p.unit}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--secondary-text)', marginTop: '2px' }}>
                            Category: <strong>{p.category}</strong> • Qty Sold: <strong>{p.quantitySold.toFixed(2)} {p.unit}</strong>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: pColor, fontSize: '15px' }}>
                          ₹{p.totalRevenue.toFixed(2)}
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', backgroundColor: '#E5E7EB', padding: '2px 6px', borderRadius: '4px', marginTop: '2px', display: 'inline-block' }}>
                          {p.percentage}% Share
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </div>

        {/* CHART 2: CUSTOMER SALES PURCHASES (HORIZONTAL BARS SVG) */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 14px 0', color: 'var(--primary-text)' }}>
            👥 Top Customer Purchases
          </h3>

          {customerSales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--secondary-text)', fontSize: '13px' }}>
              No customer transactions recorded for this filter range.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {customerSales.slice(0, 5).map(c => {
                const barWidth = Math.max((c.totalAmount / maxCustAmount) * 100, 4);

                return (
                  <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary-text)' }}>{c.customerName}</span>
                      <span style={{ fontWeight: 800, color: 'var(--primary-green)' }}>₹{c.totalAmount.toFixed(2)}</span>
                    </div>

                    <div style={{ width: '100%', height: '10px', backgroundColor: '#F3F4F6', borderRadius: '5px', overflow: 'hidden' }}>
                      <div 
                        style={{
                          width: `${barWidth}%`, height: '100%',
                          backgroundColor: 'var(--primary-green)', borderRadius: '5px',
                          transition: 'width 0.3s ease'
                        }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* 6. DAY-WISE SALES TREND & MONTHLY HISTORICAL TREND CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        
        {/* DAY-WISE SALES TREND LINE CHART */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 14px 0', color: 'var(--primary-text)' }}>
            📈 Day-Wise Sales Trend ({startDate} to {endDate})
          </h3>

          {dayTrends.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--secondary-text)', fontSize: '13px' }}>
              No trend data available for this range.
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <div style={{ minWidth: '300px', height: '180px', position: 'relative' }}>
                <svg width="100%" height="180" viewBox="0 0 500 180" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="500" y2="30" stroke="#E5E7EB" strokeDasharray="3 3" />
                  <line x1="0" y1="80" x2="500" y2="80" stroke="#E5E7EB" strokeDasharray="3 3" />
                  <line x1="0" y1="130" x2="500" y2="130" stroke="#E5E7EB" strokeDasharray="3 3" />

                  {/* Trend Area & Polyline */}
                  {(() => {
                    const points = dayTrends.map((d, i) => {
                      const x = (i / Math.max(dayTrends.length - 1, 1)) * 500;
                      const y = 160 - ((d.salesAmount / maxDaySales) * 130);
                      return `${x},${y}`;
                    }).join(' ');

                    const areaPoints = `0,160 ${points} 500,160`;

                    return (
                      <>
                        <polygon points={areaPoints} fill="rgba(5, 150, 105, 0.12)" />
                        <polyline fill="none" stroke="#059669" strokeWidth="3" points={points} />
                        {dayTrends.map((d, i) => {
                          const x = (i / Math.max(dayTrends.length - 1, 1)) * 500;
                          const y = 160 - ((d.salesAmount / maxDaySales) * 130);
                          return (
                            <circle key={i} cx={x} cy={y} r="4" fill="#059669" stroke="#fff" strokeWidth="2">
                              <title>{d.date}: ₹{d.salesAmount.toFixed(2)}</title>
                            </circle>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>

                {/* X-Axis Date Labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--secondary-text)', marginTop: '6px' }}>
                  <span>{dayTrends[0]?.date || ''}</span>
                  <span>{dayTrends[Math.floor(dayTrends.length / 2)]?.date || ''}</span>
                  <span>{dayTrends[dayTrends.length - 1]?.date || ''}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 6-MONTH HISTORICAL TREND BAR CHART */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 14px 0', color: 'var(--primary-text)' }}>
            📊 6-Month Historical Sales Trend
          </h3>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '160px', gap: '8px', paddingTop: '10px' }}>
            {monthTrends.map(m => {
              const barHeight = Math.max((m.salesAmount / maxMonthSales) * 120, 6);
              const isCurrent = m.monthKey === format(new Date(), 'yyyy-MM');

              return (
                <div 
                  key={m.monthKey}
                  onClick={() => handleHistoricalMonthSelect(m.monthKey)}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--primary-green)', marginBottom: '4px' }}>
                    ₹{m.salesAmount > 1000 ? `${(m.salesAmount / 1000).toFixed(1)}k` : m.salesAmount.toFixed(0)}
                  </span>

                  <div 
                    title={`${m.monthName}: ₹${m.salesAmount.toFixed(2)}`}
                    style={{
                      width: '100%', maxWidth: '36px', height: `${barHeight}px`,
                      backgroundColor: isCurrent ? 'var(--primary-green)' : '#A7F3D0',
                      borderRadius: '6px 6px 0 0',
                      transition: 'all 0.2s ease'
                    }}
                  />

                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-text)', marginTop: '6px' }}>
                    {m.monthName.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 7. DETAILED DATA TABLES (TABBED INTERFACE) */}
      <div className="card" style={{ padding: '20px' }}>
        
        {/* Table Tab Controls */}
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTableTab('products')}
            style={{
              padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, border: 'none',
              backgroundColor: activeTableTab === 'products' ? 'var(--primary-green)' : '#F3F4F6',
              color: activeTableTab === 'products' ? '#fff' : 'var(--primary-text)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Package size={16} />
            <span>Product Sales Details ({productSales.length})</span>
          </button>

          <button
            onClick={() => setActiveTableTab('customers')}
            style={{
              padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, border: 'none',
              backgroundColor: activeTableTab === 'customers' ? 'var(--primary-green)' : '#F3F4F6',
              color: activeTableTab === 'customers' ? '#fff' : 'var(--primary-text)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Users size={16} />
            <span>Customer Sales Ledger ({customerSales.length})</span>
          </button>

          <button
            onClick={() => setActiveTableTab('daywise')}
            style={{
              padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, border: 'none',
              backgroundColor: activeTableTab === 'daywise' ? 'var(--primary-green)' : '#F3F4F6',
              color: activeTableTab === 'daywise' ? '#fff' : 'var(--primary-text)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Calendar size={16} />
            <span>Day-Wise Breakdown ({dayTrends.length})</span>
          </button>
        </div>

        {/* TAB 1: PRODUCT SALES TABLE */}
        {activeTableTab === 'products' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Product & Milk Type</th>
                  <th style={{ padding: '10px' }}>Category</th>
                  <th style={{ padding: '10px' }}>Unit</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Price Rate</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Qty Sold</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Total Revenue (₹)</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Share (%)</th>
                </tr>
              </thead>
              <tbody>
                {productSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--secondary-text)' }}>
                      No product sales recorded for this period.
                    </td>
                  </tr>
                ) : (
                  productSales.map((p, idx) => {
                    const pColor = getProductColor(p.productName, p.category, idx);

                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px', fontWeight: 700, color: 'var(--primary-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: pColor, display: 'inline-block', flexShrink: 0 }} />
                          <span>🥛 {p.productName}</span>
                        </td>
                        <td style={{ padding: '10px', color: 'var(--secondary-text)' }}>{p.category}</td>
                        <td style={{ padding: '10px', color: 'var(--secondary-text)' }}>{p.unit}</td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: '#047857' }}>
                          <span style={{ backgroundColor: '#D1FAE5', padding: '3px 8px', borderRadius: '6px', fontSize: '12px' }}>
                            ₹{p.averagePrice.toFixed(2)} / {p.unit}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>{p.quantitySold.toFixed(2)} {p.unit}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: pColor }}>₹{p.totalRevenue.toFixed(2)}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>{p.percentage}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: CUSTOMER SALES LEDGER TABLE */}
        {activeTableTab === 'customers' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Customer Name</th>
                  <th style={{ padding: '10px' }}>Mobile Number</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Deliveries Count</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Total Volume Purchased</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Total Purchased Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {customerSales.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--secondary-text)' }}>
                      No customer delivery records for this period.
                    </td>
                  </tr>
                ) : (
                  customerSales.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px', fontWeight: 700, color: 'var(--primary-text)' }}>{c.customerName}</td>
                      <td style={{ padding: '10px', color: 'var(--secondary-text)' }}>{c.mobileNumber || 'N/A'}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>{c.transactionCount}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>{c.totalQuantity.toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: 'var(--primary-green)' }}>₹{c.totalAmount.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: DAY-WISE BREAKDOWN TABLE */}
        {activeTableTab === 'daywise' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Delivery Date</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Transactions Count</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Total Volume Sold</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Daily Revenue (₹)</th>
                </tr>
              </thead>
              <tbody>
                {dayTrends.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--secondary-text)' }}>
                      No daily records found for this period.
                    </td>
                  </tr>
                ) : (
                  dayTrends.map(d => (
                    <tr key={d.date} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px', fontWeight: 700, color: 'var(--primary-text)' }}>📅 {d.date}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>{d.transactionCount}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>{d.quantitySold.toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: 'var(--primary-green)' }}>₹{d.salesAmount.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
