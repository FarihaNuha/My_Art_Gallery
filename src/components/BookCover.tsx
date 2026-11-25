import React from 'react';
import { BookOpen } from 'lucide-react';
import { CornerOrnament } from './CornerOrnament';
import { BookSpine } from './BookSpine';

interface BookCoverProps {
  isOpen: boolean;
  isClosing: boolean;
  onOpen: () => void;
  artworkCount: number;
}

export const BookCover: React.FC<BookCoverProps> = ({
  isOpen,
  isClosing,
  onOpen,
  artworkCount,
}) => {
  const isFlipped = isOpen && !isClosing;

  return (
    <div
      onClick={!isFlipped ? onOpen : undefined}
      role={!isFlipped ? 'button' : undefined}
      tabIndex={!isFlipped ? 0 : -1}
      onKeyDown={(e) => {
        if (!isFlipped && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={!isFlipped ? 'Open The Art Archive book' : undefined}
      className={`
        absolute inset-0 preserve-3d origin-left
        transition-transform duration-[1100ms] ease-[cubic-bezier(0.645,0.045,0.355,1)]
        ${!isFlipped ? 'cursor-pointer group' : 'pointer-events-none'}
      `}
      style={{
        transform: isFlipped
          ? 'translateZ(-16px) rotateY(-180deg)'
          : 'translateZ(16px) rotateY(0deg)',
        zIndex: isFlipped ? 1 : 50,
      }}
    >
      {/* FRONT OF HARDCOVER */}
      <div
        className="
          absolute inset-0 backface-hidden rounded-r-xl rounded-l-[4px]
          leather-cover overflow-hidden flex
          border-y-2 border-r-2 border-[#233127]
        "
        style={{
          boxShadow: !isFlipped
            ? '14px 18px 42px rgba(0,0,0,0.68), 4px 6px 14px rgba(0,0,0,0.5), inset 0 0 40px rgba(0,0,0,0.35)'
            : 'none',
        }}
      >
        {/* Left raised leather spine */}
        <BookSpine className="w-7 sm:w-9 shrink-0 border-r border-[#1B261E]" />

        {/* Main front cover face */}
        <div className="relative flex-1 p-5 sm:p-8 flex flex-col justify-between">
          {/* Outer embossed gold frame */}
          <div
            className="
              relative flex-1 rounded-sm p-4 sm:p-7 flex flex-col items-center justify-between
              border border-[#B69A64]/70
            "
            style={{
              boxShadow:
                'inset 0 0 0 4px rgba(52,72,58,0.9), inset 0 0 0 5px rgba(182,154,100,0.45), 0 1px 2px rgba(0,0,0,0.45)',
            }}
          >
            {/* Ornamental corners */}
            <CornerOrnament position="top-left" size={42} className="absolute top-2 left-2 opacity-90" />
            <CornerOrnament position="top-right" size={42} className="absolute top-2 right-2 opacity-90" />
            <CornerOrnament position="bottom-left" size={42} className="absolute bottom-2 left-2 opacity-90" />
            <CornerOrnament position="bottom-right" size={42} className="absolute bottom-2 right-2 opacity-90" />

            {/* Top archival crest / divider */}
            <div className="mt-4 sm:mt-6 flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <span className="h-[1px] w-8 sm:w-12 bg-[#B69A64]/65" />
                <span className="text-[10px] sm:text-xs tracking-[0.32em] uppercase font-display text-[#B69A64]/90">
                  Archival Edition
                </span>
                <span className="h-[1px] w-8 sm:w-12 bg-[#B69A64]/65" />
              </div>
            </div>

            {/* Central Gold-Embossed Title Plaque */}
            <div className="my-auto text-center px-2 sm:px-3 py-4 sm:py-8 relative">
              <div
                className="w-14 sm:w-16 h-[1px] mx-auto mb-3.5 sm:mb-5 bg-gradient-to-r from-transparent via-[#B69A64] to-transparent"
              />
              <h1 className="font-display text-2xl sm:text-4xl md:text-[2.6rem] font-semibold tracking-[0.14em] leading-tight gold-emboss">
                THE ART
                <br />
                ARCHIVE
              </h1>
              <div className="my-3 sm:my-4 flex items-center justify-center gap-2">
                <span className="h-[1px] w-8 sm:w-10 bg-[#B69A64]/50" />
                <span className="w-1.5 h-1.5 rotate-45 border border-[#B69A64]" />
                <span className="h-[1px] w-8 sm:w-10 bg-[#B69A64]/50" />
              </div>
              <p className="font-serif-title italic text-sm sm:text-xl tracking-wide text-[#D8C5A3]/90">
                A Collection of Creative Expressions
              </p>

              {/* Open Book CTA Button */}
              <div className="mt-5 sm:mt-9 flex justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen();
                  }}
                  className="
                    inline-flex items-center gap-2.5 px-6 py-2.5 rounded-sm
                    border border-[#B69A64]/80 bg-[#26362B]/85
                    text-[#E8D8B5] font-display text-xs sm:text-sm tracking-[0.22em] uppercase
                    shadow-[0_4px_14px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(212,188,139,0.25)]
                    transition-all duration-300
                    group-hover:bg-[#2F4335] group-hover:border-[#D4BC8B] group-hover:text-[#F5EDDE]
                    hover:scale-[1.02] active:scale-[0.99] cursor-pointer
                  "
                >
                  <BookOpen className="w-4 h-4 text-[#B69A64]" />
                  <span>Open The Book</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="mb-3 sm:mb-4 flex flex-col items-center gap-1.5">
              {artworkCount > 0 && (
                <span className="font-serif-body text-xs tracking-[0.18em] uppercase text-[#B69A64]/75">
                  {artworkCount} {artworkCount === 1 ? 'Preserved Work' : 'Preserved Works'}
                </span>
              )}
              <span className="font-display text-[11px] sm:text-xs tracking-[0.35em] text-[#B69A64]/85">
                EST. 2026
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* INSIDE OF FRONT HARDCOVER (visible when book is open) */}
      <div
        className="
          absolute inset-0 backface-hidden rounded-l-xl rounded-r-[4px]
          leather-cover p-3 sm:p-4 flex
          border-y-2 border-l-2 border-[#233127]
        "
        style={{
          transform: 'rotateY(180deg)',
          boxShadow: 'inset -12px 0 24px rgba(0,0,0,0.35)',
        }}
      >
        <div className="w-full h-full endpaper-pattern rounded-l-md border border-[#B69A64]/45 p-5 sm:p-8 flex flex-col items-center justify-between text-center gutter-left">
          <div className="w-full flex justify-between items-center text-[10px] tracking-[0.25em] uppercase font-display text-[#795C42]/70">
            <span>Ex Libris</span>
            <span>Archival Folio</span>
          </div>

          <div className="my-auto max-w-xs border border-[#B69A64]/60 bg-[#F5EDDE]/75 px-6 py-8 shadow-sm">
            <p className="font-display text-[11px] tracking-[0.28em] uppercase text-[#795C42] mb-2">
              Personal Collection
            </p>
            <h2 className="font-serif-title text-2xl sm:text-3xl font-semibold text-[#35291F] tracking-wide">
              The Art Archive
            </h2>
            <div className="w-12 h-[1px] bg-[#B69A64] mx-auto my-3" />
            <p className="font-serif-body italic text-sm sm:text-base text-[#795C42] leading-relaxed">
              Every page is reserved for an original work, preserved in its true proportion and form.
            </p>
          </div>

          <div className="text-[11px] font-serif-body italic text-[#795C42]/75">
            Bound in Forest Leather &amp; Archival Parchment
          </div>
        </div>
      </div>
    </div>
  );
};
