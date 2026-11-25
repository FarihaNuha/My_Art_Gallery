import React, { useState } from 'react';
import { KeyRound, Lock, X } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const expectedPasscode =
    (import.meta.env.VITE_ADMIN_PASSCODE as string | undefined)?.trim() || 'archive2026';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === expectedPasscode) {
      setPasscode('');
      setError(null);
      onSuccess();
      onClose();
    } else {
      setError('Incorrect curator passcode. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#16110D]/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-login-title"
    >
      <div className="w-full max-w-sm paper-surface border-2 border-[#B69A64] rounded-sm shadow-[0_24px_60px_rgba(0,0,0,0.65)] overflow-hidden">
        <div className="px-5 py-3.5 bg-[#34483A] border-b border-[#B69A64]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#B69A64]" />
            <h3
              id="admin-login-title"
              className="font-display text-sm tracking-[0.14em] uppercase text-[#F5EDDE]"
            >
              Curator Admin Access
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#D8C5A3] hover:text-[#F5EDDE] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="font-serif-body text-sm text-[#795C42] leading-relaxed">
            Enter the curator passcode to upload, edit, or organize artworks in The Art Archive.
          </p>

          <div>
            <label
              htmlFor="curator-passcode"
              className="block font-display text-[11px] tracking-[0.16em] uppercase text-[#35291F] mb-1.5"
            >
              Passcode
            </label>
            <input
              id="curator-passcode"
              type="password"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError(null);
              }}
              placeholder="Enter passcode"
              autoFocus
              required
              className="
                w-full px-3 py-2 bg-[#F5EDDE] border border-[#795C42]/60
                font-serif-body text-base text-[#35291F]
                focus:outline-none focus:border-[#34483A]
              "
            />
          </div>

          {error && (
            <p className="text-xs font-serif-body text-[#7A2E2E] bg-[#7A2E2E]/10 border border-[#7A2E2E]/30 px-3 py-1.5">
              {error}
            </p>
          )}

          <div className="pt-1 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-[#795C42]/60 text-[#35291F] font-display text-[11px] tracking-[0.14em] uppercase hover:bg-[#E8D8B5] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#34483A] text-[#F5EDDE] font-display text-[11px] tracking-[0.14em] uppercase hover:bg-[#27382C] transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#B69A64]" />
              <span>Unlock Admin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
