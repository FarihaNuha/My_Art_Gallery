import React, { useEffect, useState } from 'react';
import { Check, ImagePlus, Pencil, RefreshCw, Trash2, X } from 'lucide-react';
import type { Artwork, BookPage } from '../types/archive';

interface ArtworkPageProps {
  page: BookPage;
  artwork?: Artwork;
  canRemoveEmptyPage: boolean;
  onOpenInsertModal: (pageId: string, pageNumber: number) => void;
  onOpenReplaceModal: (artwork: Artwork) => void;
  onSaveTitle: (artworkId: string, newTitle: string) => Promise<void>;
  onDeleteArtwork: (pageId: string) => Promise<void>;
  onRemoveEmptyPage: (pageId: string) => Promise<void>;
}

export const ArtworkPage: React.FC<ArtworkPageProps> = ({
  page,
  artwork,
  canRemoveEmptyPage,
  onOpenInsertModal,
  onOpenReplaceModal,
  onSaveTitle,
  onDeleteArtwork,
  onRemoveEmptyPage,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (artwork?.imageUrl) {
      setImageUrl(artwork.imageUrl);
      return;
    }
    if (!artwork?.imageBlob) {
      setImageUrl(null);
      return;
    }
    const url = URL.createObjectURL(artwork.imageBlob);
    setImageUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [artwork?.imageUrl, artwork?.imageBlob, artwork?.updatedAt]);

  useEffect(() => {
    setIsEditingTitle(false);
    setConfirmingDelete(false);
  }, [page.id, artwork?.id]);

  const formattedPage = String(page.pageNumber).padStart(2, '0');

  const handleStartEdit = () => {
    if (!artwork) return;
    setDraftTitle(artwork.title);
    setIsEditingTitle(true);
  };

  const handleConfirmTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artwork || !draftTitle.trim() || isBusy) return;
    setIsBusy(true);
    try {
      await onSaveTitle(artwork.id, draftTitle.trim());
      setIsEditingTitle(false);
    } finally {
      setIsBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      await onDeleteArtwork(page.id);
      setConfirmingDelete(false);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-8 select-none">
      {/* Top archival plate label & page actions */}
      <div className="flex items-center justify-between pb-2 border-b border-[#B69A64]/35">
        <span className="font-display text-[10px] sm:text-[11px] tracking-[0.26em] uppercase text-[#795C42]">
          Artwork &middot; Plate {formattedPage}
        </span>

        {artwork ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleStartEdit}
              title="Edit artwork title"
              className="p-1.5 rounded-sm text-[#795C42] hover:text-[#35291F] hover:bg-[#D8C5A3]/45 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onOpenReplaceModal(artwork)}
              title="Replace artwork image"
              className="p-1.5 rounded-sm text-[#795C42] hover:text-[#35291F] hover:bg-[#D8C5A3]/45 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              title="Remove artwork from page"
              className="p-1.5 rounded-sm text-[#795C42] hover:text-[#7A2E2E] hover:bg-[#D8C5A3]/45 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          canRemoveEmptyPage && (
            <button
              type="button"
              onClick={() => onRemoveEmptyPage(page.id)}
              title="Remove empty page"
              className="text-[10px] font-display tracking-[0.14em] uppercase text-[#795C42]/70 hover:text-[#7A2E2E] transition-colors cursor-pointer"
            >
              Remove Page
            </button>
          )
        )}
      </div>

      {/* Main Artwork Display Area (Strict Original Aspect Ratio Preservation) */}
      <div className="flex-1 min-h-0 my-3 sm:my-4 flex items-center justify-center relative">
        {artwork && imageUrl ? (
          <div className="w-full h-full flex items-center justify-center p-2 sm:p-3 bg-[#E8D8B5]/45 border border-[#B69A64]/45 rounded-[2px] shadow-[inset_0_1px_6px_rgba(53,41,31,0.12)]">
            <img
              src={imageUrl}
              alt={artwork.title}
              className="max-w-full max-h-full w-auto h-auto object-contain block shadow-[0_4px_16px_rgba(53,41,31,0.22)]"
            />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 border border-dashed border-[#B69A64]/70 bg-[#E8D8B5]/25 rounded-[2px] text-center">
            <div className="w-11 h-11 rounded-full border border-[#B69A64]/60 bg-[#F5EDDE]/80 flex items-center justify-center mb-3 text-[#795C42]">
              <ImagePlus className="w-5 h-5" />
            </div>
            <p className="font-serif-title italic text-base sm:text-lg text-[#795C42] mb-1">
              Unassigned Archival Page
            </p>
            <p className="font-serif-body text-xs text-[#78836A] mb-5 max-w-[210px]">
              Preserve an original artwork on Page {formattedPage} in its exact proportion.
            </p>
            <button
              type="button"
              onClick={() => onOpenInsertModal(page.id, page.pageNumber)}
              className="
                inline-flex items-center gap-2 px-4 py-2 rounded-sm
                border border-[#795C42]/70 bg-[#34483A] text-[#F5EDDE]
                font-display text-[11px] tracking-[0.18em] uppercase
                shadow-sm hover:bg-[#27382C] transition-colors cursor-pointer
              "
            >
              <ImagePlus className="w-3.5 h-3.5 text-[#B69A64]" />
              <span>Insert Artwork</span>
            </button>
          </div>
        )}

        {/* Delete Confirmation Overlay */}
        {confirmingDelete && artwork && (
          <div className="absolute inset-0 bg-[#F5EDDE]/95 backdrop-blur-[2px] border border-[#B69A64]/60 flex flex-col items-center justify-center p-6 text-center z-20">
            <p className="font-display text-xs tracking-[0.2em] uppercase text-[#795C42] mb-2">
              Confirm Removal
            </p>
            <p className="font-serif-title text-lg text-[#35291F] mb-1">
              Remove &ldquo;{artwork.title}&rdquo;?
            </p>
            <p className="font-serif-body text-xs text-[#795C42] mb-5 max-w-[230px]">
              This will clear Page {formattedPage} and update the Table of Contents.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setConfirmingDelete(false)}
                className="px-3.5 py-1.5 border border-[#795C42]/50 text-xs font-display tracking-[0.14em] uppercase text-[#35291F] hover:bg-[#E8D8B5] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 bg-[#6E2B26] text-[#F5EDDE] text-xs font-display tracking-[0.14em] uppercase hover:bg-[#57201C] transition-colors cursor-pointer"
              >
                {isBusy ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Title, Gold Divider, and Page Number */}
      <div className="pt-2">
        <div className="w-24 h-[1px] mx-auto mb-2.5 bg-gradient-to-r from-transparent via-[#B69A64] to-transparent" />

        {artwork ? (
          isEditingTitle ? (
            <form onSubmit={handleConfirmTitle} className="flex items-center justify-center gap-1.5 mb-2">
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                autoFocus
                maxLength={80}
                className="
                  px-2.5 py-1 text-center font-serif-title text-base sm:text-lg
                  bg-[#F5EDDE] border border-[#795C42]/60 text-[#35291F]
                  focus:outline-none focus:border-[#34483A] w-full max-w-[230px]
                "
              />
              <button
                type="submit"
                disabled={!draftTitle.trim() || isBusy}
                title="Save title"
                className="p-1.5 bg-[#34483A] text-[#F5EDDE] rounded-sm hover:bg-[#27382C] disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingTitle(false)}
                title="Cancel edit"
                className="p-1.5 border border-[#795C42]/50 text-[#795C42] rounded-sm hover:bg-[#E8D8B5] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="text-center mb-1.5">
              <h3 className="font-serif-title text-lg sm:text-xl font-semibold text-[#35291F] tracking-wide truncate px-2">
                {artwork.title}
              </h3>
              <p className="font-serif-body text-[11px] text-[#795C42]/75">
                {artwork.originalWidth} &times; {artwork.originalHeight} px
              </p>
            </div>
          )
        ) : (
          <div className="text-center mb-2">
            <span className="font-serif-body italic text-xs text-[#795C42]/65">
              Reserved for Artwork
            </span>
          </div>
        )}

        <div className="flex items-center justify-center">
          <span className="font-display text-[11px] tracking-[0.22em] text-[#795C42]">
            {formattedPage}
          </span>
        </div>
      </div>
    </div>
  );
};
