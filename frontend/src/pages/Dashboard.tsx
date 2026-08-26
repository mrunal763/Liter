import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, UserPlus, CreditCard, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();
  
  // Dashboard states
  const [stats, setStats] = useState({
    todaySales: 0,
    milkSold: 0,
    customersServed: 0,
    outstandingAmount: 0
  });
  const [businessName, setBusinessName] = useState('Liter');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load dashboard metrics
    const fetchDashboardData = async () => {
      try {
        const response = await authFetch('/reports/dashboard');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    // Load business settings
    const fetchSettings = async () => {
      try {
        const response = await authFetch('/settings/profile');
        if (response.ok) {
          const data = await response.json();
          if (data.businessName) {
            setBusinessName(data.businessName);
          }
        }
      } catch (error) {
        console.error('Error fetching business settings:', error);
      }
    };

    fetchDashboardData();
    fetchSettings();
  }, []);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Welcome banner */}
      <div>
        <div style={{ fontSize: '15px', color: 'var(--secondary-text)', fontWeight: 500 }}>
          {getGreeting()}, {user?.fullName || 'Farmer'} 👋
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '2px', color: 'var(--primary-green)' }}>
          {businessName}
        </h2>
      </div>

      {/* Main KPI Stats Block */}
      <div style={{
        backgroundColor: 'var(--primary-green)',
        backgroundImage: 'linear-gradient(135deg, var(--primary-green) 0%, var(--dark-green) 100%)',
        color: 'var(--white)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ fontSize: '14px', opacity: 0.85, fontWeight: 500 }}>Today's Sales</div>
        <div style={{ fontSize: '38px', fontWeight: 800, margin: '4px 0 16px 0' }}>
          ₹{stats.todaySales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
        
        <div className="stats-grid" style={{ 
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          paddingTop: '16px'
        }}>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.8, fontWeight: 500 }}>Milk Sold</div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px' }}>{stats.milkSold} L</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.8, fontWeight: 500 }}>Served</div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px' }}>{stats.customersServed}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.8, fontWeight: 500 }}>Outstanding</div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px' }}>₹{stats.outstandingAmount.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions Header */}
      <div>
        <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Quick Actions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <button 
            onClick={() => navigate('/delivery')}
            className="card" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              width: '100%', 
              textAlign: 'left',
              padding: '16px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                backgroundColor: 'var(--light-green)', 
                color: 'var(--primary-green)', 
                padding: '12px', 
                borderRadius: '50%' 
              }}>
                <Truck size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>Record Today's Delivery</div>
                <div style={{ fontSize: '12px', color: 'var(--secondary-text)', marginTop: '2px' }}>
                  Log morning/evening milk runs
                </div>
              </div>
            </div>
            <ChevronRight size={20} style={{ color: 'var(--secondary-text)' }} />
          </button>

          <button 
            onClick={() => navigate('/customers')}
            className="card" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              width: '100%', 
              textAlign: 'left',
              padding: '16px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                backgroundColor: 'var(--light-green)', 
                color: 'var(--primary-green)', 
                padding: '12px', 
                borderRadius: '50%' 
              }}>
                <UserPlus size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>Add Customer</div>
                <div style={{ fontSize: '12px', color: 'var(--secondary-text)', marginTop: '2px' }}>
                  Register a new subscriber
                </div>
              </div>
            </div>
            <ChevronRight size={20} style={{ color: 'var(--secondary-text)' }} />
          </button>

          <button 
            onClick={() => navigate('/payments')}
            className="card" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              width: '100%', 
              textAlign: 'left',
              padding: '16px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                backgroundColor: 'var(--light-green)', 
                color: 'var(--primary-green)', 
                padding: '12px', 
                borderRadius: '50%' 
              }}>
                <CreditCard size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>Record Payment</div>
                <div style={{ fontSize: '12px', color: 'var(--secondary-text)', marginTop: '2px' }}>
                  Log cash, UPI, or bank transfer
                </div>
              </div>
            </div>
            <ChevronRight size={20} style={{ color: 'var(--secondary-text)' }} />
          </button>

        </div>
      </div>
    </div>
  );
};
