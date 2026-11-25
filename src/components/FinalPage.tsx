import React from 'react';
import { Book } from 'lucide-react';

interface FinalPageProps {
  pageNumber: number;
  artworkCount: number;
  onCloseBook: () => void;
}

export const FinalPage: React.FC<FinalPageProps> = ({
  pageNumber,
  artworkCount,
  onCloseBook,
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-7 sm:p-10 text-center select-none">
      <div className="w-full flex items-center justify-center gap-3 pt-2">
        <span className="h-[1px] w-10 bg-[#B69A64]/65" />
        <span className="font-display text-[10px] tracking-[0.3em] uppercase text-[#795C42]">
          Colophon
        </span>
        <span className="h-[1px] w-10 bg-[#B69A64]/65" />
      </div>

      <div className="my-auto max-w-xs space-y-5">
        <div className="w-2 h-2 rotate-45 border border-[#B69A64] mx-auto" />

        <p className="font-serif-title italic text-xl sm:text-2xl leading-relaxed text-[#35291F]">
          Every artwork tells a story.
          <br />
          Every page preserves a moment.
        </p>

        <div className="w-24 h-[1px] mx-auto bg-gradient-to-r from-transparent via-[#B69A64] to-transparent" />

        <p className="font-display text-xs sm:text-sm tracking-[0.28em] uppercase text-[#795C42]">
          END OF COLLECTION
        </p>

        <p className="font-serif-body text-xs text-[#78836A]">
          {artworkCount} {artworkCount === 1 ? 'artwork' : 'artworks'} archived
        </p>

        <div className="pt-3">
          <button
            type="button"
            onClick={onCloseBook}
            className="
              inline-flex items-center gap-2 px-5 py-2 rounded-sm
              border border-[#B69A64]/80 bg-[#34483A] text-[#F5EDDE]
              font-display text-[11px] tracking-[0.2em] uppercase
              hover:bg-[#27382C] transition-colors cursor-pointer shadow-sm
            "
          >
            <Book className="w-3.5 h-3.5 text-[#B69A64]" />
            <span>Close The Book</span>
          </button>
        </div>
      </div>

      <div className="pb-1">
        <span className="font-display text-[11px] tracking-[0.22em] text-[#795C42]">
          {String(pageNumber).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};
