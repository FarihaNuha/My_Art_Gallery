import React from 'react';
import { Plus } from 'lucide-react';
import type { TocEntry } from '../types/archive';

interface TableOfContentsProps {
  entries: TocEntry[];
  pageNumber: number;
  onNavigateToPage: (pageNumber: number) => void;
  onAddPage: () => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  entries,
  pageNumber,
  onNavigateToPage,
  onAddPage,
}) => {
  const formatNum = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 sm:p-9 select-none">
      {/* Top editorial header */}
      <div className="text-center pt-1">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="h-[1px] w-8 bg-[#B69A64]/70" />
          <span className="font-display text-[10px] tracking-[0.28em] uppercase text-[#795C42]">
            Index
          </span>
          <span className="h-[1px] w-8 bg-[#B69A64]/70" />
        </div>

        <h2 className="font-display text-lg sm:text-2xl tracking-[0.16em] text-[#35291F] font-semibold">
          TABLE OF CONTENTS
        </h2>
        <p className="font-serif-title italic text-sm sm:text-base text-[#795C42] mt-1">
          A Record of Artistic Expressions
        </p>

        <div className="mt-4 mx-auto w-32 h-[1px] bg-gradient-to-r from-transparent via-[#B69A64] to-transparent" />
      </div>

      {/* Entries list (initially completely empty) */}
      <div className="flex-1 my-5 overflow-y-auto archive-scroll pr-1">
        {entries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-10 h-[1px] bg-[#B69A64]/50 mb-4" />
            <p className="font-serif-title italic text-base sm:text-lg text-[#795C42]/80">
              This archive awaits its first work.
            </p>
            <p className="font-serif-body text-xs sm:text-sm text-[#78836A] mt-1.5 max-w-[230px]">
              Turn the page to insert an artwork; its title and page number will be recorded here automatically.
            </p>
            <div className="w-10 h-[1px] bg-[#B69A64]/50 mt-4" />
          </div>
        ) : (
          <ul className="space-y-2.5 sm:space-y-3 py-1">
            {entries.map((entry) => (
              <li key={entry.artworkId}>
                <button
                  type="button"
                  onClick={() => onNavigateToPage(entry.pageNumber)}
                  className="
                    w-full group flex items-baseline gap-2 text-left py-1 px-1.5 rounded-sm
                    transition-colors duration-200 hover:bg-[#D8C5A3]/35 cursor-pointer
                  "
                >
                  <span className="font-display text-xs text-[#795C42] shrink-0">
                    {formatNum(entry.index)}.
                  </span>
                  <span className="font-serif-title text-base sm:text-lg text-[#35291F] group-hover:text-[#34483A] transition-colors truncate">
                    {entry.title}
                  </span>
                  <span
                    className="flex-1 border-b border-dotted border-[#795C42]/45 mb-[4px] min-w-[16px]"
                    aria-hidden="true"
                  />
                  <span className="font-display text-xs sm:text-sm text-[#795C42] group-hover:text-[#34483A] shrink-0">
                    {formatNum(entry.pageNumber)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bottom footer with Add Page & Page Number */}
      <div className="pt-3 border-t border-[#B69A64]/35 flex items-center justify-between">
        <button
          type="button"
          onClick={onAddPage}
          className="
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm
            text-[11px] font-display tracking-[0.12em] uppercase
            text-[#795C42] border border-[#B69A64]/50 bg-[#E8D8B5]/40
            hover:bg-[#E8D8B5] hover:text-[#35291F] hover:border-[#795C42]/60
            transition-colors cursor-pointer
          "
        >
          <Plus className="w-3 h-3" />
          <span>Add Page</span>
        </button>

        <span className="font-display text-[11px] tracking-[0.2em] text-[#795C42]">
          {formatNum(pageNumber)}
        </span>
      </div>
    </div>
  );
};
