import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardCheck, Users, Receipt, Package, CreditCard, BarChart2, Settings, LogOut, X, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MoreDrawer: React.FC<MoreDrawerProps> = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    onClose();
    logout();
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/delivery', label: 'Daily Delivery', icon: ClipboardCheck },
    { to: '/customers', label: 'Customers Directory', icon: Users },
    { to: '/billing', label: 'Monthly Billing', icon: Receipt },
    { to: '/products', label: 'Products Catalog', icon: Package },
    { to: '/reports', label: 'Analytics & Reports', icon: BarChart2 },
    { to: '/settings', label: 'Settings & Profile', icon: Settings },
  ];

  return (
    <div className={`more-drawer ${isOpen ? 'open' : ''}`}>
      <div className="drawer-overlay" onClick={onClose}></div>
      <div className="drawer-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--primary-green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
              L
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--primary-text)' }}>LITER Navigation</h2>
          </div>
          <button onClick={onClose} style={{ color: 'var(--primary-text)', padding: '6px', borderRadius: '50%', backgroundColor: '#F3F4F6' }}>
            <X size={20} />
          </button>
        </div>

        {/* Logged In User Card */}
        {user && (
          <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--very-light-green)', border: '1px solid #A7F3D0', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px' }}>
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'O'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.fullName || 'Dairy Owner'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--secondary-text)' }}>
                @{user.username || 'admin'}
              </div>
            </div>
          </div>
        )}

        {/* Links List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;

            return (
              <Link 
                key={link.to} 
                to={link.to} 
                className={`drawer-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
                style={{
                  backgroundColor: isActive ? 'var(--light-green)' : 'transparent',
                  color: isActive ? 'var(--primary-green)' : 'var(--primary-text)',
                  fontWeight: isActive ? 700 : 500
                }}
              >
                <Icon size={20} style={{ color: isActive ? 'var(--primary-green)' : '#6B7280' }} />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <button 
            onClick={handleLogout} 
            className="drawer-link logout" 
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', marginTop: 'auto', paddingTop: '16px' }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>

      </div>
    </div>
  );
};
