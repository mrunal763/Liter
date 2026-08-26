import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ClipboardCheck, Users, Receipt, MoreHorizontal } from 'lucide-react';

interface BottomNavProps {
  onMoreClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onMoreClick }) => {
  const location = useLocation();

  const handleMoreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onMoreClick();
  };

  return (
    <nav className="bottom-nav">
      <NavLink 
        to="/" 
        className={({ isActive }) => `nav-item ${isActive && location.pathname === '/' ? 'active' : ''}`}
      >
        <Home size={20} />
        <span>Home</span>
      </NavLink>

      <NavLink 
        to="/delivery" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <ClipboardCheck size={20} />
        <span>Delivery</span>
      </NavLink>

      <NavLink 
        to="/customers" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Users size={20} />
        <span>Customers</span>
      </NavLink>

      <NavLink 
        to="/billing" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Receipt size={20} />
        <span>Billing</span>
      </NavLink>

      <a 
        href="#more" 
        onClick={handleMoreClick}
        className="nav-item"
        style={{ cursor: 'pointer' }}
      >
        <MoreHorizontal size={20} />
        <span>More</span>
      </a>
    </nav>
  );
};
