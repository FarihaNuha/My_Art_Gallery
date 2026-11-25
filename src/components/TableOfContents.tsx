import React from 'react';
import { Plus } from 'lucide-react';
import type { TocEntry } from '../types/archive';

interface TableOfContentsProps {
  entries: TocEntry[];
  pageNumber: number;
  isAdmin: boolean;
  onNavigateToPage: (pageNumber: number) => void;
  onAddPage: () => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  entries,
  pageNumber,
  isAdmin,
  onNavigateToPage,
  onAddPage,
}) => {
  const formatNum = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="w-full h-full flex flex-col justify-between p-2.5 sm:p-8 select-none">
      {/* Top editorial header */}
      <div className="text-center pt-0.5 sm:pt-1">
        <div className="flex items-center justify-center gap-1.5 sm:gap-3 mb-1 sm:mb-2">
          <span className="h-[1px] w-4 sm:w-8 bg-[#B69A64]/70" />
          <span className="font-display text-[7px] sm:text-[10px] tracking-[0.22em] sm:tracking-[0.28em] uppercase text-[#795C42]">
            Index
          </span>
          <span className="h-[1px] w-4 sm:w-8 bg-[#B69A64]/70" />
        </div>

        <h2 className="font-display text-[11px] sm:text-2xl tracking-[0.12em] sm:tracking-[0.16em] text-[#35291F] font-semibold leading-tight">
          TABLE OF CONTENTS
        </h2>
        <p className="font-serif-title italic text-[10px] sm:text-base text-[#795C42] mt-0.5 sm:mt-1">
          A Record of Artistic Expressions
        </p>

        <div className="mt-1.5 sm:mt-4 mx-auto w-16 sm:w-32 h-[1px] bg-gradient-to-r from-transparent via-[#B69A64] to-transparent" />
      </div>

      {/* Entries list */}
      <div className="flex-1 my-1.5 sm:my-5 overflow-y-auto archive-scroll pr-0.5 sm:pr-1">
        {entries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-1 sm:px-4">
            <div className="w-6 sm:w-10 h-[1px] bg-[#B69A64]/50 mb-2 sm:mb-4" />
            <p className="font-serif-title italic text-[11px] sm:text-lg text-[#795C42]/80 leading-snug">
              This archive awaits its first work.
            </p>
            <p className="font-serif-body text-[9px] sm:text-sm text-[#78836A] mt-1 sm:mt-1.5 max-w-[230px] leading-tight sm:leading-normal">
              {isAdmin
                ? 'Turn the page to insert an artwork; its title and page number will be recorded here.'
                : 'Turn the pages to explore the collection.'}
            </p>
            <div className="w-6 sm:w-10 h-[1px] bg-[#B69A64]/50 mt-2 sm:mt-4" />
          </div>
        ) : (
          <ul className="space-y-1 sm:space-y-2.5 py-0.5 sm:py-1">
            {entries.map((entry) => (
              <li key={entry.artworkId}>
                <button
                  type="button"
                  onClick={() => onNavigateToPage(entry.pageNumber)}
                  className="
                    w-full group flex items-baseline gap-1 sm:gap-2 text-left py-0.5 sm:py-1 px-1 sm:px-1.5 rounded-sm
                    transition-colors duration-200 hover:bg-[#D8C5A3]/35 cursor-pointer
                  "
                >
                  <span className="font-display text-[8px] sm:text-xs text-[#795C42] shrink-0">
                    {formatNum(entry.index)}.
                  </span>
                  <span className="font-serif-title text-[10px] sm:text-lg text-[#35291F] group-hover:text-[#34483A] transition-colors truncate">
                    {entry.title}
                  </span>
                  <span
                    className="flex-1 border-b border-dotted border-[#795C42]/45 mb-[2px] sm:mb-[4px] min-w-[6px] sm:min-w-[16px]"
                    aria-hidden="true"
                  />
                  <span className="font-display text-[8px] sm:text-sm text-[#795C42] group-hover:text-[#34483A] shrink-0">
                    {formatNum(entry.pageNumber)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bottom footer with Add Page (Admin only) & Page Number */}
      <div className="pt-1.5 sm:pt-3 border-t border-[#B69A64]/35 flex items-center justify-between">
        {isAdmin ? (
          <button
            type="button"
            onClick={onAddPage}
            className="
              inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-sm
              text-[8px] sm:text-[11px] font-display tracking-[0.1em] sm:tracking-[0.12em] uppercase
              text-[#795C42] border border-[#B69A64]/50 bg-[#E8D8B5]/40
              hover:bg-[#E8D8B5] hover:text-[#35291F] hover:border-[#795C42]/60
              transition-colors cursor-pointer
            "
          >
            <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>Add Page</span>
          </button>
        ) : (
          <span className="font-serif-body italic text-[8px] sm:text-[11px] text-[#795C42]/70">
            Archive Index
          </span>
        )}

        <span className="font-display text-[9px] sm:text-[11px] tracking-[0.2em] text-[#795C42]">
          {formatNum(pageNumber)}
        </span>
      </div>
    </div>
  );
};
