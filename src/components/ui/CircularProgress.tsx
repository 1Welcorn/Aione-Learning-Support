import React from 'react';

interface CircularProgressProps {
  percentage: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({ percentage }) => {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        stroke="#e4e2dc"
        strokeWidth="7"
      />
      <circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        stroke="var(--teal)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circumference}
        style={{
          strokeDashoffset: offset,
          transform: 'rotate(-90deg)',
          transformOrigin: '32px 32px',
          transition: 'stroke-dashoffset 0.6s ease',
        }}
      />
    </svg>
  );
};
