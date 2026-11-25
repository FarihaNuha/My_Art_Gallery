import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Plus,
  BookOpen,
  BookMarked,
  RotateCcw,
} from 'lucide-react';
import type { Artwork, BookPage, ImageDimensions, TocEntry } from '../types/archive';
import { BookCover } from './BookCover';
import { BookSpine } from './BookSpine';
import { CornerOrnament } from './CornerOrnament';
import { TableOfContents } from './TableOfContents';
import { ArtworkPage } from './ArtworkPage';
import { FinalPage } from './FinalPage';
import { ArtworkUploaderModal } from './ArtworkUploaderModal';

interface ArtBookProps {
  pages: BookPage[];
  artworks: Artwork[];
  onInsertArtwork: (
    pageId: string,
    title: string,
    file: File,
    dimensions: ImageDimensions
  ) => Promise<void>;
  onUpdateTitle: (artworkId: string, newTitle: string) => Promise<void>;
  onReplaceImage: (
    artworkId: string,
    file: File,
    dimensions: ImageDimensions
  ) => Promise<void>;
  onDeleteArtwork: (pageId: string) => Promise<void>;
  onAddPage: () => Promise<number>;
  onRemoveEmptyPage: (pageId: string) => Promise<void>;
}

interface SheetPair {
  index: number;
  front: BookPage;
  back?: BookPage;
}

export const ArtBook: React.FC<ArtBookProps> = ({
  pages,
  artworks,
  onInsertArtwork,
  onUpdateTitle,
  onReplaceImage,
  onDeleteArtwork,
  onAddPage,
  onRemoveEmptyPage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [closedSide, setClosedSide] = useState<'front' | 'back'>('front');
  const [currentSpread, setCurrentSpread] = useState(0);
  const [mobilePageIndex, setMobilePageIndex] = useState(0);
  const [flippingSheetIndex, setFlippingSheetIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'insert' | 'replace';
    pageId: string;
    artworkId?: string;
    pageNumber: number;
    initialTitle?: string;
  }>({
    isOpen: false,
    mode: 'insert',
    pageId: '',
    pageNumber: 2,
  });

  const stageRef = useRef<HTMLDivElement>(null);
  const animationTimersRef = useRef<number[]>([]);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    for (const id of animationTimersRef.current) {
      window.clearTimeout(id);
    }
    animationTimersRef.current = [];
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const artworkById = useMemo(() => {
    const map = new Map<string, Artwork>();
    for (const art of artworks) {
      map.set(art.id, art);
    }
    return map;
  }, [artworks]);

  const tocEntries: TocEntry[] = useMemo(() => {
    const populated = pages
      .filter((p) => p.pageType === 'artwork' && p.artworkId)
      .map((p) => {
        const art = artworkById.get(p.artworkId!);
        if (!art) return null;
        return {
          artworkId: art.id,
          title: art.title,
          pageNumber: p.pageNumber,
        };
      })
      .filter((item): item is Omit<TocEntry, 'index'> => item !== null)
      .sort((a, b) => a.pageNumber - b.pageNumber);

    return populated.map((item, idx) => ({
      ...item,
      index: idx + 1,
    }));
  }, [pages, artworkById]);

  const sheets: SheetPair[] = useMemo(() => {
    const result: SheetPair[] = [];
    for (let i = 0; i < pages.length; i += 2) {
      result.push({
        index: result.length,
        front: pages[i],
        back: pages[i + 1],
      });
    }
    return result;
  }, [pages]);

  const emptyArtworkPagesCount = useMemo(
    () => pages.filter((p) => p.pageType === 'artwork').length,
    [pages]
  );

  // Max spread index where the final page is visible
  const maxSpread = useMemo(() => {
    const lastPage = pages[pages.length - 1];
    if (!lastPage) return 0;
    return Math.floor(lastPage.pageNumber / 2);
  }, [pages]);

  const triggerSheetFlip = useCallback((sheetIdx: number) => {
    setFlippingSheetIndex(sheetIdx);
    const t = window.setTimeout(() => {
      setFlippingSheetIndex((prev) => (prev === sheetIdx ? null : prev));
    }, 780);
    animationTimersRef.current.push(t);
  }, []);

  const handleOpenBook = useCallback(() => {
    if (isOpen && !isClosing) return;
    clearTimers();
    setIsClosing(false);
    setClosedSide('front');
    setCurrentSpread(0);
    setMobilePageIndex(0);
    setIsOpen(true);
  }, [isOpen, isClosing, clearTimers]);

  // Close from the front (returns to Front Cover)
  const handleCloseToFront = useCallback(() => {
    if (!isOpen || isClosing) return;
    clearTimers();
    setIsClosing(true);

    if (isMobile) {
      const stepsToClose = mobilePageIndex;
      if (stepsToClose === 0) {
        setClosedSide('front');
        setIsOpen(false);
        const t = window.setTimeout(() => setIsClosing(false), 1100);
        animationTimersRef.current.push(t);
        return;
      }
      for (let step = 1; step <= stepsToClose; step++) {
        const t = window.setTimeout(() => {
          setMobilePageIndex((prev) => Math.max(0, prev - 1));
          if (step === stepsToClose) {
            const closeCoverTimer = window.setTimeout(() => {
              setClosedSide('front');
              setIsOpen(false);
              const finishTimer = window.setTimeout(() => setIsClosing(false), 1100);
              animationTimersRef.current.push(finishTimer);
            }, 320);
            animationTimersRef.current.push(closeCoverTimer);
          }
        }, step * 110);
        animationTimersRef.current.push(t);
      }
      return;
    }

    const stepsToClose = currentSpread;
    if (stepsToClose === 0) {
      setClosedSide('front');
      setIsOpen(false);
      const t = window.setTimeout(() => setIsClosing(false), 1100);
      animationTimersRef.current.push(t);
      return;
    }

    for (let step = 1; step <= stepsToClose; step++) {
      const t = window.setTimeout(() => {
        setCurrentSpread((prev) => {
          const next = Math.max(0, prev - 1);
          triggerSheetFlip(next);
          return next;
        });
        if (step === stepsToClose) {
          const closeCoverTimer = window.setTimeout(() => {
            setClosedSide('front');
            setIsOpen(false);
            const finishTimer = window.setTimeout(() => setIsClosing(false), 1100);
            animationTimersRef.current.push(finishTimer);
          }, 360);
          animationTimersRef.current.push(closeCoverTimer);
        }
      }, step * 130);
      animationTimersRef.current.push(t);
    }
  }, [isOpen, isClosing, isMobile, mobilePageIndex, currentSpread, clearTimers, triggerSheetFlip]);

  // Close from the end / final page (flips Back Cover from right to left and shows Back Cover)
  const handleCloseToBack = useCallback(() => {
    if (!isOpen || isClosing) return;
    clearTimers();
    setIsClosing(true);

    if (isMobile) {
      // Flip any remaining page(s) to the left, then flip back cover over
      const remaining = pages.length - mobilePageIndex;
      for (let step = 1; step <= remaining; step++) {
        const t = window.setTimeout(() => {
          setMobilePageIndex((prev) => Math.min(pages.length, prev + 1));
        }, (step - 1) * 140);
        animationTimersRef.current.push(t);
      }
      const closeTimer = window.setTimeout(() => {
        setClosedSide('back');
        setIsOpen(false);
        const finishTimer = window.setTimeout(() => setIsClosing(false), 1100);
        animationTimersRef.current.push(finishTimer);
      }, Math.max(1, remaining) * 160);
      animationTimersRef.current.push(closeTimer);
      return;
    }

    // Desktop: flip any remaining unflipped sheets to the left, then flip Back Cover from right to left
    const remainingSheets = sheets.length - currentSpread;
    for (let step = 1; step <= remainingSheets; step++) {
      const t = window.setTimeout(() => {
        setCurrentSpread((prev) => {
          triggerSheetFlip(prev);
          return Math.min(sheets.length, prev + 1);
        });
      }, (step - 1) * 160);
      animationTimersRef.current.push(t);
    }

    const closeBackTimer = window.setTimeout(() => {
      setClosedSide('back');
      setIsOpen(false);
      const finishTimer = window.setTimeout(() => setIsClosing(false), 1100);
      animationTimersRef.current.push(finishTimer);
    }, Math.max(0, remainingSheets) * 200 + 120);
    animationTimersRef.current.push(closeBackTimer);
  }, [
    isOpen,
    isClosing,
    isMobile,
    pages.length,
    mobilePageIndex,
    sheets.length,
    currentSpread,
    clearTimers,
    triggerSheetFlip,
  ]);

  const handleReopenFromBack = useCallback(() => {
    if (isOpen || isClosing) return;
    clearTimers();
    setClosedSide('front');
    if (isMobile) {
      setMobilePageIndex(pages.length - 1);
    } else {
      setCurrentSpread(maxSpread);
    }
    setIsOpen(true);
  }, [isOpen, isClosing, isMobile, pages.length, maxSpread, clearTimers]);

  const handleFlipToFrontCover = useCallback(() => {
    if (isOpen || isClosing) return;
    clearTimers();
    setClosedSide('front');
    setCurrentSpread(0);
    setMobilePageIndex(0);
  }, [isOpen, isClosing, clearTimers]);

  const navigateToPageNumber = useCallback(
    (targetPageNumber: number) => {
      if (!isOpen) return;
      clearTimers();

      if (isMobile) {
        const targetIdx = Math.max(0, Math.min(pages.length - 1, targetPageNumber - 1));
        if (targetIdx === mobilePageIndex) return;
        const direction = targetIdx > mobilePageIndex ? 1 : -1;
        const distance = Math.abs(targetIdx - mobilePageIndex);
        for (let step = 1; step <= distance; step++) {
          const t = window.setTimeout(() => {
            setMobilePageIndex((prev) => {
              const next = prev + direction;
              triggerSheetFlip(direction > 0 ? prev : next);
              return next;
            });
          }, (step - 1) * 140);
          animationTimersRef.current.push(t);
        }
        return;
      }

      const targetSpread = Math.min(maxSpread, Math.floor(targetPageNumber / 2));
      if (targetSpread === currentSpread) return;

      const direction = targetSpread > currentSpread ? 1 : -1;
      const distance = Math.abs(targetSpread - currentSpread);

      for (let step = 1; step <= distance; step++) {
        const t = window.setTimeout(() => {
          setCurrentSpread((prev) => {
            const next = prev + direction;
            triggerSheetFlip(direction > 0 ? prev : next);
            return next;
          });
        }, (step - 1) * 150);
        animationTimersRef.current.push(t);
      }
    },
    [isOpen, isMobile, pages.length, mobilePageIndex, maxSpread, currentSpread, clearTimers, triggerSheetFlip]
  );

  const handleNextPage = useCallback(() => {
    if (!isOpen || isClosing) return;

    if (isMobile) {
      if (mobilePageIndex >= pages.length - 1) {
        handleCloseToBack();
        return;
      }
      triggerSheetFlip(mobilePageIndex);
      setMobilePageIndex((prev) => prev + 1);
      return;
    }

    if (currentSpread >= maxSpread) {
      handleCloseToBack();
      return;
    }
    triggerSheetFlip(currentSpread);
    setCurrentSpread((prev) => prev + 1);
  }, [
    isOpen,
    isClosing,
    isMobile,
    mobilePageIndex,
    pages.length,
    currentSpread,
    maxSpread,
    handleCloseToBack,
    triggerSheetFlip,
  ]);

  const handlePrevPage = useCallback(() => {
    if (!isOpen || isClosing) return;

    if (isMobile) {
      if (mobilePageIndex <= 0) {
        handleCloseToFront();
        return;
      }
      triggerSheetFlip(mobilePageIndex - 1);
      setMobilePageIndex((prev) => prev - 1);
      return;
    }

    if (currentSpread <= 0) {
      handleCloseToFront();
      return;
    }
    triggerSheetFlip(currentSpread - 1);
    setCurrentSpread((prev) => prev - 1);
  }, [
    isOpen,
    isClosing,
    isMobile,
    mobilePageIndex,
    currentSpread,
    handleCloseToFront,
    triggerSheetFlip,
  ]);

  // Keyboard arrow navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (modalState.isOpen) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (!isOpen && (e.key === 'Enter' || e.key === 'ArrowRight')) {
        e.preventDefault();
        if (closedSide === 'back') {
          handleReopenFromBack();
        } else {
          handleOpenBook();
        }
        return;
      }

      if (!isOpen) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevPage();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isOpen,
    closedSide,
    modalState.isOpen,
    handleOpenBook,
    handleReopenFromBack,
    handleNextPage,
    handlePrevPage,
  ]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && stageRef.current) {
        await stageRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore if fullscreen is blocked by browser
    }
  };

  const handleAddNewPageAndGo = async () => {
    const newPageNum = await onAddPage();
    navigateToPageNumber(newPageNum);
  };

  const renderPageContent = (page: BookPage) => {
    if (page.pageType === 'toc') {
      return (
        <TableOfContents
          entries={tocEntries}
          pageNumber={page.pageNumber}
          onNavigateToPage={navigateToPageNumber}
          onAddPage={handleAddNewPageAndGo}
        />
      );
    }

    if (page.pageType === 'final') {
      return (
        <FinalPage
          pageNumber={page.pageNumber}
          artworkCount={artworks.length}
          onCloseBook={handleCloseToBack}
        />
      );
    }

    const artwork = page.artworkId ? artworkById.get(page.artworkId) : undefined;
    return (
      <ArtworkPage
        page={page}
        artwork={artwork}
        canRemoveEmptyPage={emptyArtworkPagesCount > 1}
        onOpenInsertModal={(pageId, pageNumber) =>
          setModalState({
            isOpen: true,
            mode: 'insert',
            pageId,
            pageNumber,
          })
        }
        onOpenReplaceModal={(art) =>
          setModalState({
            isOpen: true,
            mode: 'replace',
            pageId: page.id,
            artworkId: art.id,
            pageNumber: page.pageNumber,
            initialTitle: art.title,
          })
        }
        onSaveTitle={onUpdateTitle}
        onDeleteArtwork={onDeleteArtwork}
        onRemoveEmptyPage={onRemoveEmptyPage}
      />
    );
  };

  const visiblePageSummary = useMemo(() => {
    if (!isOpen) return closedSide === 'back' ? 'Back Cover' : 'Closed Volume';
    if (isMobile) {
      const p = pages[Math.min(mobilePageIndex, pages.length - 1)];
      return p
        ? `Page ${String(p.pageNumber).padStart(2, '0')} of ${String(pages.length).padStart(2, '0')}`
        : '';
    }
    if (currentSpread === 0) {
      return `Page 01 of ${String(pages.length).padStart(2, '0')}`;
    }
    const leftPage = pages[currentSpread * 2 - 1];
    const rightPage = pages[currentSpread * 2];
    if (leftPage && rightPage) {
      return `Pages ${String(leftPage.pageNumber).padStart(2, '0')}–${String(rightPage.pageNumber).padStart(2, '0')} of ${String(pages.length).padStart(2, '0')}`;
    }
    if (leftPage) {
      return `Page ${String(leftPage.pageNumber).padStart(2, '0')} of ${String(pages.length).padStart(2, '0')}`;
    }
    return '';
  }, [isOpen, closedSide, isMobile, mobilePageIndex, currentSpread, pages]);

  const isOnFinalSpread = isMobile
    ? mobilePageIndex >= pages.length - 1
    : currentSpread >= maxSpread;

  const isBackCoverClosed = !isOpen && closedSide === 'back';

  // Position book wrapper in viewport:
  // - Front closed: translateX(0%) -> [0, W] centered
  // - Open (desktop): translateX(50%) -> [-W, W] spread centered
  // - Back closed: translateX(100%) -> [-W, 0] back cover centered
  const wrapperTranslateX = isBackCoverClosed
    ? '100%'
    : !isMobile && isOpen && !isClosing
    ? '50%'
    : '0%';

  // When closed on the back cover, the front cover stays at -180deg underneath
  const frontCoverIsOpen = isOpen || isBackCoverClosed;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (modalState.isOpen || e.touches.length !== 1) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (modalState.isOpen || touchStartXRef.current === null || touchStartYRef.current === null) {
      return;
    }
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    const dy = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    // Only trigger horizontal swipe when clearly horizontal (> 48px and > vertical)
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;

    if (!isOpen) {
      if (dx < 0) {
        if (closedSide === 'back') handleReopenFromBack();
        else handleOpenBook();
      }
      return;
    }

    if (dx < 0) {
      handleNextPage();
    } else {
      handlePrevPage();
    }
  };

  return (
    <div
      ref={stageRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="min-h-[100dvh] w-full studio-backdrop flex flex-col items-center justify-between py-3 px-3 sm:py-7 sm:px-6 overflow-hidden select-none"
    >
      {/* Subtle Top Archival Bar (only visible when book is open) */}
      <header
        className={`
          w-full max-w-5xl flex items-center justify-between gap-2 px-1 sm:px-2 transition-opacity duration-500
          ${isOpen && !isClosing ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        <button
          type="button"
          onClick={() => navigateToPageNumber(1)}
          className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-display tracking-[0.14em] sm:tracking-[0.18em] uppercase text-[#D8C5A3]/85 hover:text-[#F5EDDE] transition-colors cursor-pointer shrink-0 py-1"
        >
          <BookMarked className="w-3.5 h-3.5 text-[#B69A64]" />
          <span className="hidden sm:inline">Table of Contents</span>
          <span className="sm:hidden">Contents</span>
        </button>

        <div className="text-center min-w-0 truncate">
          <span className="font-display text-[10px] sm:text-xs tracking-[0.14em] sm:tracking-[0.2em] uppercase text-[#E8D8B5]/90">
            {visiblePageSummary}
          </span>
          <span className="mx-1.5 sm:mx-2 text-[#B69A64]/60">&middot;</span>
          <span className="font-serif-body italic text-xs sm:text-sm text-[#D8C5A3]/80">
            {artworks.length} {artworks.length === 1 ? 'work' : 'works'}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={handleAddNewPageAndGo}
            className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-display tracking-[0.14em] uppercase text-[#D8C5A3]/85 hover:text-[#F5EDDE] transition-colors cursor-pointer py-1"
            title="Add another artwork page"
          >
            <Plus className="w-3.5 h-3.5 text-[#B69A64]" />
            <span className="hidden sm:inline">New Page</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 text-[#D8C5A3]/80 hover:text-[#F5EDDE] transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen reading mode'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen reading mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Center Stage: Physical Hardcover Book */}
      <main className="flex-1 w-full flex items-center justify-center my-1 sm:my-4 book-perspective">
        <div
          className="relative preserve-3d transition-transform duration-[1000ms] ease-[cubic-bezier(0.645,0.045,0.355,1)]"
          style={{
            width: isMobile ? 'min(90vw, 400px)' : 'min(42vw, 490px)',
            height: isMobile ? 'min(72dvh, 560px)' : 'min(76dvh, 660px)',
            transform: `translateX(${wrapperTranslateX})`,
          }}
        >
          {/* Natural drop shadow beneath the physical book */}
          <div
            className="absolute -bottom-5 left-2 right-2 h-8 rounded-[50%] pointer-events-none transition-all duration-700"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.65) 0%, transparent 72%)',
              transform: isBackCoverClosed
                ? 'scaleX(1.02) translateX(-100%)'
                : !isMobile && isOpen && !isClosing
                ? 'scaleX(2.05) translateX(-25%)'
                : 'scaleX(1.02)',
            }}
          />

          {/* BACK HARDCOVER (rotates from 0deg to -180deg when closing at the end to show the Back Cover!) */}
          <div
            className="
              absolute inset-0 preserve-3d origin-left
              transition-transform duration-[1100ms] ease-[cubic-bezier(0.645,0.045,0.355,1)]
            "
            style={{
              transform: isBackCoverClosed
                ? 'translateZ(20px) rotateY(-180deg)'
                : 'translateZ(-20px) rotateY(0deg)',
              zIndex: isBackCoverClosed ? 80 : 0,
            }}
          >
            {/* Inside of Back Cover (visible when book is open) */}
            <div
              className="
                absolute inset-0 backface-hidden rounded-r-xl rounded-l-[4px] leather-cover
                border-y-2 border-r-2 border-[#233127] p-2.5 sm:p-3
              "
              style={{
                boxShadow:
                  '10px 14px 36px rgba(0,0,0,0.6), inset 0 0 24px rgba(0,0,0,0.45)',
              }}
            >
              <div className="w-full h-full endpaper-pattern rounded-r-md border border-[#B69A64]/40 gutter-right flex items-center justify-center">
                <span className="font-serif-title italic text-sm text-[#795C42]/60">
                  The Art Archive &middot; Endpaper
                </span>
              </div>
            </div>

            {/* OUTER BACK COVER (visible when book is closed from the end!) */}
            <div
              className="
                absolute inset-0 backface-hidden rounded-l-xl rounded-r-[4px]
                leather-cover overflow-hidden flex
                border-y-2 border-l-2 border-[#233127]
              "
              style={{
                transform: 'rotateY(180deg)',
                boxShadow:
                  '-14px 18px 42px rgba(0,0,0,0.68), -4px 6px 14px rgba(0,0,0,0.5), inset 0 0 40px rgba(0,0,0,0.35)',
              }}
            >
              {/* Main back cover leather face */}
              <div className="relative flex-1 p-5 sm:p-8 flex flex-col justify-between">
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
                  <CornerOrnament position="top-left" size={42} className="absolute top-2 left-2 opacity-90" />
                  <CornerOrnament position="top-right" size={42} className="absolute top-2 right-2 opacity-90" />
                  <CornerOrnament position="bottom-left" size={42} className="absolute bottom-2 left-2 opacity-90" />
                  <CornerOrnament position="bottom-right" size={42} className="absolute bottom-2 right-2 opacity-90" />

                  {/* Top archival crest / divider (matches Front Cover) */}
                  <div className="mt-4 sm:mt-6 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-3">
                      <span className="h-[1px] w-8 sm:w-12 bg-[#B69A64]/65" />
                      <span className="text-[10px] sm:text-xs tracking-[0.32em] uppercase font-display text-[#B69A64]/90">
                        Archival Edition
                      </span>
                      <span className="h-[1px] w-8 sm:w-12 bg-[#B69A64]/65" />
                    </div>
                  </div>

                  {/* Central Gold-Embossed Title Plaque (matches Front Cover) */}
                  <div className="my-auto text-center px-3 py-6 sm:py-8 relative">
                    <div className="w-16 h-[1px] mx-auto mb-5 bg-gradient-to-r from-transparent via-[#B69A64] to-transparent" />
                    <h2 className="font-display text-2xl sm:text-4xl md:text-[2.6rem] font-semibold tracking-[0.14em] leading-tight gold-emboss">
                      THE ART
                      <br />
                      ARCHIVE
                    </h2>
                    <div className="my-4 flex items-center justify-center gap-2">
                      <span className="h-[1px] w-10 bg-[#B69A64]/50" />
                      <span className="w-1.5 h-1.5 rotate-45 border border-[#B69A64]" />
                      <span className="h-[1px] w-10 bg-[#B69A64]/50" />
                    </div>
                    <p className="font-serif-title italic text-base sm:text-xl tracking-wide text-[#D8C5A3]/90">
                      A Collection of Creative Expressions
                    </p>

                    <div className="mt-7 sm:mt-9 flex flex-col items-center gap-3">
                      <button
                        type="button"
                        onClick={handleReopenFromBack}
                        className="
                          inline-flex items-center gap-2.5 px-6 py-2.5 rounded-sm
                          border border-[#B69A64]/80 bg-[#26362B]/85
                          text-[#E8D8B5] font-display text-xs sm:text-sm tracking-[0.22em] uppercase
                          shadow-[0_4px_14px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(212,188,139,0.25)]
                          transition-all duration-300
                          hover:bg-[#2F4335] hover:border-[#D4BC8B] hover:text-[#F5EDDE]
                          hover:scale-[1.02] active:scale-[0.99] cursor-pointer
                        "
                      >
                        <ChevronLeft className="w-4 h-4 text-[#B69A64]" />
                        <span>Previous Page</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleFlipToFrontCover}
                        className="
                          inline-flex items-center gap-1.5 px-4 py-1.5 rounded-sm
                          border border-[#B69A64]/45 bg-[#26362B]/55
                          text-[#D8C5A3]/90 hover:text-[#F5EDDE] hover:border-[#B69A64]/80
                          font-display text-[10px] sm:text-xs tracking-[0.18em] uppercase
                          transition-colors cursor-pointer
                        "
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#B69A64]" />
                        <span>1st Cover Page</span>
                      </button>
                    </div>
                  </div>

                  {/* Footer (matches Front Cover) */}
                  <div className="mb-3 sm:mb-4 flex flex-col items-center gap-1.5">
                    {artworks.length > 0 && (
                      <span className="font-serif-body text-xs tracking-[0.18em] uppercase text-[#B69A64]/75">
                        {artworks.length} {artworks.length === 1 ? 'Preserved Work' : 'Preserved Works'}
                      </span>
                    )}
                    <span className="font-display text-[11px] sm:text-xs tracking-[0.35em] text-[#B69A64]/85">
                      EST. 2026
                    </span>
                  </div>
                </div>
              </div>

              {/* Right raised leather spine on back cover */}
              <BookSpine className="w-7 sm:w-9 shrink-0 border-l border-[#1B261E]" />
            </div>
          </div>

          {/* THICK LAYERED PAGE EDGES */}
          {!isBackCoverClosed && (
            <>
              <div
                className="absolute top-[7px] bottom-[7px] -right-[8px] w-[10px] rounded-r-[2px] page-edges-right pointer-events-none border-y border-r border-[#8A7142]/40"
                style={{
                  transform: 'translateZ(-6px)',
                  boxShadow: '2px 0 6px rgba(0,0,0,0.35)',
                }}
                aria-hidden="true"
              />
              <div
                className="absolute left-[10px] right-[2px] -bottom-[6px] h-[8px] rounded-b-[2px] page-edges-bottom pointer-events-none border-x border-b border-[#8A7142]/40"
                style={{
                  transform: 'translateZ(-6px)',
                }}
                aria-hidden="true"
              />
            </>
          )}

          {/* INNER PAGES STACK */}
          <div className="absolute inset-[6px] sm:inset-[8px] preserve-3d">
            {isMobile
              ? /* MOBILE: Single-page leaves */
                pages.map((page, idx) => {
                  const isFlipped = idx < mobilePageIndex;
                  const isFlipping = flippingSheetIndex === idx;
                  const zIndex = isFlipping
                    ? pages.length + 10
                    : isFlipped
                    ? idx + 1
                    : pages.length - idx;

                  return (
                    <div
                      key={page.id}
                      className="
                        absolute inset-0 preserve-3d origin-left
                        transition-transform duration-[700ms] ease-[cubic-bezier(0.645,0.045,0.355,1)]
                      "
                      style={{
                        transform: isFlipped ? 'rotateY(-180deg)' : 'rotateY(0deg)',
                        zIndex,
                      }}
                    >
                      <div className="absolute inset-0 backface-hidden paper-surface rounded-r-md border border-[#B69A64]/55 gutter-right overflow-hidden">
                        {renderPageContent(page)}
                      </div>
                      <div
                        className="absolute inset-0 backface-hidden paper-surface-aged rounded-l-md border border-[#B69A64]/45"
                        style={{ transform: 'rotateY(180deg)' }}
                      />
                    </div>
                  );
                })
              : /* DESKTOP / TABLET: Two-page spread leaves */
                sheets.map((sheet) => {
                  const isFlipped = sheet.index < currentSpread;
                  const isFlipping = flippingSheetIndex === sheet.index;
                  const zIndex = isFlipping
                    ? sheets.length + 12
                    : isFlipped
                    ? sheet.index + 1
                    : sheets.length - sheet.index;

                  return (
                    <div
                      key={sheet.front.id}
                      className="
                        absolute inset-0 preserve-3d origin-left
                        transition-transform duration-[750ms] ease-[cubic-bezier(0.645,0.045,0.355,1)]
                      "
                      style={{
                        transform: isFlipped ? 'rotateY(-180deg)' : 'rotateY(0deg)',
                        zIndex,
                      }}
                    >
                      {/* FRONT OF SHEET (Right-hand page when unflipped) */}
                      <div
                        className="
                          absolute inset-0 backface-hidden paper-surface
                          rounded-r-md border border-[#B69A64]/55 gutter-right overflow-hidden
                        "
                      >
                        {renderPageContent(sheet.front)}

                        {/* Dynamic fold shadow during flip */}
                        <div
                          className={`
                            absolute inset-0 pointer-events-none transition-opacity duration-500
                            bg-gradient-to-r from-black/15 via-transparent to-black/10
                            ${isFlipping ? 'opacity-100' : 'opacity-0'}
                          `}
                        />

                        {/* Clickable bottom-right page corner for tactile turning */}
                        {isOpen && !isFlipped && (
                          <button
                            type="button"
                            onClick={handleNextPage}
                            title={
                              sheet.front.pageType === 'final'
                                ? 'Close book'
                                : 'Turn to next page'
                            }
                            aria-label="Turn to next page"
                            className="
                              absolute bottom-0 right-0 w-10 h-10
                              bg-gradient-to-tl from-[#D8C5A3]/70 via-[#E8D8B5]/20 to-transparent
                              hover:from-[#B69A64]/50 transition-all cursor-pointer
                            "
                            style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}
                          />
                        )}
                      </div>

                      {/* BACK OF SHEET (Left-hand page when flipped) */}
                      <div
                        className="
                          absolute inset-0 backface-hidden paper-surface
                          rounded-l-md border border-[#B69A64]/55 gutter-left overflow-hidden
                        "
                        style={{ transform: 'rotateY(180deg)' }}
                      >
                        {sheet.back ? (
                          renderPageContent(sheet.back)
                        ) : (
                          <div className="w-full h-full endpaper-pattern flex items-center justify-center p-8 text-center">
                            <p className="font-serif-title italic text-sm text-[#795C42]/65">
                              End of Volume
                            </p>
                          </div>
                        )}

                        {/* Dynamic fold shadow during flip */}
                        <div
                          className={`
                            absolute inset-0 pointer-events-none transition-opacity duration-500
                            bg-gradient-to-l from-black/15 via-transparent to-black/10
                            ${isFlipping ? 'opacity-100' : 'opacity-0'}
                          `}
                        />

                        {/* Clickable bottom-left page corner for turning backward */}
                        {isOpen && isFlipped && (
                          <button
                            type="button"
                            onClick={handlePrevPage}
                            title="Turn to previous page"
                            aria-label="Turn to previous page"
                            className="
                              absolute bottom-0 left-0 w-10 h-10
                              bg-gradient-to-tr from-[#D8C5A3]/70 via-[#E8D8B5]/20 to-transparent
                              hover:from-[#B69A64]/50 transition-all cursor-pointer
                            "
                            style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>

          {/* FRONT HARDCOVER (rotates open/closed around left spine) */}
          <BookCover
            isOpen={frontCoverIsOpen}
            isClosing={isClosing && closedSide === 'front'}
            onOpen={handleOpenBook}
            artworkCount={artworks.length}
          />
        </div>
      </main>

      {/* Bottom Page Navigation Controls */}
      <footer
        className={`
          w-full max-w-xl flex items-center justify-center gap-4 sm:gap-7 pb-1
          transition-opacity duration-500
          ${isOpen && !isClosing ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        <button
          type="button"
          onClick={handlePrevPage}
          className="
            inline-flex items-center gap-1.5 px-4 py-2 rounded-sm
            border border-[#B69A64]/50 bg-[#2A221B]/85 text-[#E8D8B5]
            font-display text-[11px] sm:text-xs tracking-[0.16em] uppercase
            hover:bg-[#34483A] hover:border-[#B69A64] transition-colors cursor-pointer
          "
        >
          <ChevronLeft className="w-4 h-4 text-[#B69A64]" />
          <span>Previous</span>
        </button>

        <button
          type="button"
          onClick={isOnFinalSpread ? handleCloseToBack : handleCloseToFront}
          title="Close book"
          className="
            inline-flex items-center gap-1.5 px-3 py-2 rounded-sm
            text-[#D8C5A3]/75 hover:text-[#F5EDDE]
            font-display text-[10px] sm:text-[11px] tracking-[0.18em] uppercase
            transition-colors cursor-pointer
          "
        >
          <BookOpen className="w-3.5 h-3.5 text-[#B69A64]" />
          <span className="hidden sm:inline">Close</span>
        </button>

        <button
          type="button"
          onClick={handleNextPage}
          className="
            inline-flex items-center gap-1.5 px-4 py-2 rounded-sm
            border border-[#B69A64]/50 bg-[#2A221B]/85 text-[#E8D8B5]
            font-display text-[11px] sm:text-xs tracking-[0.16em] uppercase
            hover:bg-[#34483A] hover:border-[#B69A64] transition-colors cursor-pointer
          "
        >
          <span>{isOnFinalSpread ? 'Close Book' : 'Next Page'}</span>
          <ChevronRight className="w-4 h-4 text-[#B69A64]" />
        </button>
      </footer>

      {/* Artwork Upload / Replace Modal */}
      <ArtworkUploaderModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        targetPageNumber={modalState.pageNumber}
        initialTitle={modalState.initialTitle}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={async ({ title, file, dimensions }) => {
          if (modalState.mode === 'insert') {
            await onInsertArtwork(modalState.pageId, title, file, dimensions);
          } else if (modalState.artworkId) {
            await onReplaceImage(modalState.artworkId, file, dimensions);
          }
        }}
      />
    </div>
  );
};
