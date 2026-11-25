import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Upload, X } from 'lucide-react';
import { readImageDimensions } from '../services/archiveDb';
import type { ImageDimensions } from '../types/archive';

interface ArtworkUploaderModalProps {
  isOpen: boolean;
  mode: 'insert' | 'replace';
  targetPageNumber: number;
  initialTitle?: string;
  onClose: () => void;
  onConfirm: (payload: {
    title: string;
    file: File;
    dimensions: ImageDimensions;
  }) => Promise<void>;
}

export const ArtworkUploaderModal: React.FC<ArtworkUploaderModalProps> = ({
  isOpen,
  mode,
  targetPageNumber,
  initialTitle = '',
  onClose,
  onConfirm,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setSelectedFile(null);
      setPreviewUrl(null);
      setDimensions(null);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialTitle]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  if (!isOpen) return null;

  const handleFileSelected = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP, GIF, etc.).');
      return;
    }

    setError(null);
    try {
      const dims = await readImageDimensions(file);
      setSelectedFile(file);
      setDimensions(dims);
    } catch {
      setError('Unable to read image dimensions. Please try another file.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'insert' && !title.trim()) {
      setError('Please enter an artwork title before inserting into the book.');
      return;
    }
    if (!selectedFile || !dimensions) {
      setError('Please select an artwork image.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm({
        title: title.trim() || initialTitle,
        file: selectedFile,
        dimensions,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save artwork. Storage quota may be exceeded for very large files.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#16110D]/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="uploader-modal-title"
    >
      <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto paper-surface border-2 border-[#B69A64] rounded-sm shadow-[0_24px_60px_rgba(0,0,0,0.65)]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#34483A] border-b border-[#B69A64]/60 flex items-center justify-between">
          <div>
            <p className="font-display text-[10px] tracking-[0.26em] uppercase text-[#B69A64]">
              Page {String(targetPageNumber).padStart(2, '0')}
            </p>
            <h3
              id="uploader-modal-title"
              className="font-display text-base sm:text-lg tracking-[0.12em] text-[#F5EDDE]"
            >
              {mode === 'insert' ? 'Insert Artwork into Archive' : 'Replace Artwork Image'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#D8C5A3] hover:text-[#F5EDDE] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {mode === 'insert' && (
            <div>
              <label
                htmlFor="artwork-title-input"
                className="block font-display text-xs tracking-[0.18em] uppercase text-[#35291F] mb-1.5"
              >
                Artwork Title <span className="text-[#7A2E2E]">*</span>
              </label>
              <input
                id="artwork-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Silent Mountains"
                maxLength={80}
                required
                className="
                  w-full px-3.5 py-2.5 bg-[#F5EDDE] border border-[#795C42]/60
                  font-serif-title text-lg text-[#35291F] placeholder:text-[#795C42]/50
                  focus:outline-none focus:border-[#34483A]
                "
              />
            </div>
          )}

          {/* File Selector */}
          <div>
            <span className="block font-display text-xs tracking-[0.18em] uppercase text-[#35291F] mb-1.5">
              Select Artwork Image <span className="text-[#7A2E2E]">*</span>
            </span>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelected(e.target.files?.[0])}
              className="hidden"
            />

            {!previewUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileSelected(e.dataTransfer.files?.[0]);
                }}
                className="
                  w-full py-9 px-4 border border-dashed border-[#795C42]/70 bg-[#E8D8B5]/40
                  hover:bg-[#E8D8B5]/70 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer
                "
              >
                <Upload className="w-6 h-6 text-[#795C42]" />
                <span className="font-serif-title text-base text-[#35291F]">
                  Choose an image from your device or drop it here
                </span>
                <span className="font-serif-body text-xs text-[#78836A]">
                  Original proportions and full composition will be preserved without cropping.
                </span>
              </button>
            ) : (
              <div className="border border-[#B69A64]/70 bg-[#E8D8B5]/45 p-3">
                <div className="h-52 w-full flex items-center justify-center bg-[#F5EDDE]/75 p-2">
                  <img
                    src={previewUrl}
                    alt="Artwork preview"
                    className="max-w-full max-h-full w-auto h-auto object-contain block"
                  />
                </div>
                <div className="mt-2.5 flex items-center justify-between text-xs font-serif-body text-[#795C42]">
                  <span>
                    {selectedFile?.name} &middot; {dimensions?.width} &times; {dimensions?.height} px
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-display text-[11px] tracking-[0.12em] uppercase text-[#34483A] hover:underline cursor-pointer"
                  >
                    Change File
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs font-serif-body text-[#7A2E2E] bg-[#7A2E2E]/10 border border-[#7A2E2E]/30 px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#B69A64]/40">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="
                px-4 py-2 border border-[#795C42]/60 text-[#35291F]
                font-display text-xs tracking-[0.16em] uppercase
                hover:bg-[#E8D8B5] transition-colors cursor-pointer
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className="
                inline-flex items-center gap-2 px-5 py-2 bg-[#34483A] text-[#F5EDDE]
                font-display text-xs tracking-[0.16em] uppercase
                hover:bg-[#27382C] disabled:opacity-50 transition-colors cursor-pointer
              "
            >
              <ImagePlus className="w-3.5 h-3.5 text-[#B69A64]" />
              <span>
                {isSubmitting
                  ? 'Preserving...'
                  : mode === 'insert'
                  ? 'Insert into Book'
                  : 'Save Replacement'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
