import React from 'react';
import homeButtonImg from '../../assets/home-button.png';

interface HomeButtonProps {
  onClick: () => void;
  size?: number;
  className?: string;
}

export const HomeButton: React.FC<HomeButtonProps> = ({ onClick, size = 48, className = '' }) => {
  return (
    <button 
      onClick={onClick}
      className={`home-button-premium ${className}`}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        width: size,
        height: size,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <img 
        src={homeButtonImg} 
        alt="Home" 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain',
          borderRadius: '50%'
        }} 
      />
    </button>
  );
};
