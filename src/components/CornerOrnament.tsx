import React from 'react';

interface CornerOrnamentProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  color?: string;
  size?: number;
  className?: string;
}

export const CornerOrnament: React.FC<CornerOrnamentProps> = ({
  position,
  color = '#B69A64',
  size = 44,
  className = '',
}) => {
  const rotationMap: Record<CornerOrnamentProps['position'], string> = {
    'top-left': 'rotate(0deg)',
    'top-right': 'rotate(90deg)',
    'bottom-right': 'rotate(180deg)',
    'bottom-left': 'rotate(270deg)',
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ transform: rotationMap[position] }}
    >
      <path
        d="M4 56V18C4 10.268 10.268 4 18 4H56"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10 46V20C10 14.477 14.477 10 20 10H46"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.8"
      />
      <path
        d="M16 16C20 16 23 13 23 9C23 13 26 16 30 16C26 16 23 19 23 23C23 19 20 16 16 16Z"
        fill={color}
        fillOpacity="0.75"
      />
      <circle cx="11" cy="11" r="2.2" fill={color} />
      <path
        d="M6 34C10 34 12 31 12 27"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.65"
      />
      <path
        d="M34 6C34 10 31 12 27 12"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.65"
      />
    </svg>
  );
};
