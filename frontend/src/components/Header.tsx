import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { format } from 'date-fns';

interface HeaderProps {
  businessName?: string;
  session?: 'MORNING' | 'EVENING';
  date?: Date;
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  businessName = 'Liter',
  session = 'MORNING',
  date = new Date(),
  onMenuClick
}) => {
  return (
    <header className="app-header">
      <div>
        <div style={{ fontSize: '12px', opacity: 0.85, fontWeight: 500, letterSpacing: '0.5px' }}>LITER</div>
        <h1 style={{ fontSize: '18px', color: 'var(--white)', fontWeight: 700 }}>{businessName}</h1>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '6px', 
          backgroundColor: 'rgba(255,255,255,0.2)', 
          padding: '6px 12px', 
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: 600
        }}>
          {session === 'MORNING' ? (
            <Sun size={15} style={{ color: '#FCD34D' }} />
          ) : (
            <Moon size={15} style={{ color: '#A7F3D0' }} />
          )}
          <span>{format(date, 'dd MMM')}</span>
          <span style={{ fontSize: '11px', opacity: 0.8, textTransform: 'lowercase' }}>({session === 'MORNING' ? 'Morn' : 'Eve'})</span>
        </div>
        
        <button 
          onClick={onMenuClick}
          style={{ color: 'var(--white)', padding: '4px' }}
          aria-label="Open navigation menu"
        >
          <Menu size={24} />
        </button>
      </div>
    </header>
  );
};
