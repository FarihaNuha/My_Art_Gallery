import { useEffect, useRef, useState } from 'react';

export function useContentProtection(enabled: boolean) {
  const [isShieldActive, setIsShieldActive] = useState(false);
  const [shieldReason, setShieldReason] = useState<string>(
    'Protected Archive · Screen capture & saving are disabled'
  );
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsShieldActive(false);
      return;
    }

    const triggerTemporaryShield = (reason: string, durationMs = 2500) => {
      setShieldReason(reason);
      setIsShieldActive(true);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setIsShieldActive(false);
      }, durationMs);
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrlOrMeta = e.ctrlKey || e.metaKey;

      // Block PrintScreen, Print, Save, View Source, DevTools shortcuts
      if (
        e.key === 'PrintScreen' ||
        (ctrlOrMeta && (key === 'p' || key === 's' || key === 'u')) ||
        (ctrlOrMeta && e.shiftKey && (key === 's' || key === 'i' || key === 'j' || key === 'c')) ||
        (e.metaKey && e.shiftKey && (key === '3' || key === '4' || key === '5')) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerTemporaryShield('Screen capture, printing, and saving are disabled.');
        try {
          if (navigator.clipboard?.writeText) {
            void navigator.clipboard.writeText('');
          }
        } catch {
          // Ignore clipboard permission errors
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        triggerTemporaryShield('Screen capture is disabled in The Art Archive.');
        try {
          if (navigator.clipboard?.writeText) {
            void navigator.clipboard.writeText('');
          }
        } catch {
          // Ignore clipboard permission errors
        }
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        setShieldReason('Archive veiled while inactive to protect artwork.');
        setIsShieldActive(true);
      } else {
        setIsShieldActive(false);
      }
    };

    const onBlur = () => {
      setShieldReason('Archive veiled while window is unfocused to protect artwork.');
      setIsShieldActive(true);
    };

    const onFocus = () => {
      if (!document.hidden) {
        setIsShieldActive(false);
      }
    };

    const onPageHide = () => {
      setShieldReason('Archive veiled while inactive to protect artwork.');
      setIsShieldActive(true);
    };

    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('dragstart', onDragStart);
    document.addEventListener('copy', onCopy);
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    document.addEventListener('visibilitychange', onVisibilityChange);
    document.addEventListener('freeze', onPageHide);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('dragstart', onDragStart);
      document.removeEventListener('copy', onCopy);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      document.removeEventListener('freeze', onPageHide);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, [enabled]);

  return { isShieldActive, shieldReason };
}
