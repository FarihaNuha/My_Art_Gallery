import React from 'react';

interface BookSpineProps {
  className?: string;
}

export const BookSpine: React.FC<BookSpineProps> = ({ className = '' }) => {
  return (
    <div
      className={`relative flex flex-col justify-between py-8 px-1 select-none ${className}`}
      style={{
        background:
          'linear-gradient(90deg, #1E2B22 0%, #2B3D31 28%, #3A5041 55%, #233127 88%, #161F19 100%)',
        boxShadow:
          'inset 2px 0 6px rgba(255,240,210,0.08), inset -3px 0 8px rgba(0,0,0,0.55)',
      }}
      aria-hidden="true"
    >
      {/* Raised spine ribs / bands */}
      {[0, 1, 2, 3, 4].map((rib) => (
        <div key={rib} className="w-full flex flex-col items-center gap-[2px]">
          <div
            className="w-full h-[3px] rounded-full"
            style={{
              background:
                'linear-gradient(90deg, rgba(138,113,66,0.4) 0%, #D4BC8B 50%, rgba(138,113,66,0.4) 100%)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.6)',
            }}
          />
          <div className="w-full h-[1px] bg-[#17211A]/80" />
        </div>
      ))}
    </div>
  );
};
