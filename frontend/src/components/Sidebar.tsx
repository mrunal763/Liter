import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ClipboardCheck, Users, Receipt, Settings, BarChart3, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#fff',
            color: '#1b5e20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: '800'
          }}>
            L
          </div>
          <span style={{
            fontSize: '20px',
            fontWeight: '800',
            letterSpacing: '-0.5px'
          }}>
            LITER
          </span>
        </div>
        <span style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.6)',
          fontWeight: '500',
          marginTop: '4px'
        }}>
          Made with ❤️ by Mrunal
        </span>
      </div>

      {/* Navigation List */}
      <nav style={{
        flex: 1,
        padding: '24px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `sidebar-link ${isActive || location.pathname === '/' ? 'active' : ''}`}
        >
          <Home size={18} />
          <span>Home</span>
        </NavLink>

        <NavLink 
          to="/delivery" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <ClipboardCheck size={18} />
          <span>Delivery</span>
        </NavLink>

        <NavLink 
          to="/customers" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Users size={18} />
          <span>Customers</span>
        </NavLink>

        <NavLink 
          to="/billing" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Receipt size={18} />
          <span>Billing</span>
        </NavLink>

        <NavLink 
          to="/products" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Settings size={18} />
          <span>Products</span>
        </NavLink>

        <NavLink 
          to="/reports" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <BarChart3 size={18} />
          <span>Reports</span>
        </NavLink>

        <NavLink 
          to="/settings" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
      </nav>

      {/* Profile and Logout Section */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: '600',
            color: '#a2ebd0'
          }}>
            {user?.fullName?.charAt(0) || 'O'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>
              {user?.fullName || 'Owner'}
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
              {user?.username || 'admin'}
            </span>
          </div>
        </div>

        <button 
          onClick={logout}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            background: 'rgba(239, 83, 80, 0.15)',
            color: '#ef5350',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 83, 80, 0.25)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 83, 80, 0.15)'}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
