import React from 'react';
import { Link } from 'react-router-dom';
import { Package, CreditCard, BarChart2, Settings, LogOut, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MoreDrawer: React.FC<MoreDrawerProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    onClose();
    logout();
  };

  return (
    <div className={`more-drawer ${isOpen ? 'open' : ''}`}>
      <div className="drawer-overlay" onClick={onClose}></div>
      <div className="drawer-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Menu</h2>
          <button onClick={onClose} style={{ color: 'var(--primary-text)', padding: '4px' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link to="/products" className="drawer-link" onClick={onClose}>
            <Package size={20} style={{ color: 'var(--primary-green)' }} />
            <span>Products Catalog</span>
          </Link>

          <Link to="/payments" className="drawer-link" onClick={onClose}>
            <CreditCard size={20} style={{ color: 'var(--primary-green)' }} />
            <span>Payments Collected</span>
          </Link>

          <Link to="/reports" className="drawer-link" onClick={onClose}>
            <BarChart2 size={20} style={{ color: 'var(--primary-green)' }} />
            <span>Reports & Ledger</span>
          </Link>

          <Link to="/settings" className="drawer-link" onClick={onClose}>
            <Settings size={20} style={{ color: 'var(--primary-green)' }} />
            <span>Settings</span>
          </Link>

          <button onClick={handleLogout} className="drawer-link logout" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: '14px 12px' }}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
