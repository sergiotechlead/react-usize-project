import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Reusable focus-trap for modal dialogs.
 *
 * - Captures the element that had focus before the modal opened.
 * - Moves focus into the modal on open (first focusable element, or the
 *   modal container itself if nothing inside is focusable).
 * - Traps Tab / Shift+Tab so focus cycles within the modal's focusable
 *   elements instead of escaping to the page behind it.
 * - Restores focus to the trigger element on close/unmount.
 *
 * @param {import('react').RefObject<HTMLElement>} containerRef ref on the
 *   dialog container (the modal-card, not the backdrop) — must render with
 *   `tabIndex={-1}` so it can receive focus even with no focusable children.
 * @param {boolean} isOpen whether the modal is currently open.
 */
export function useFocusTrap(containerRef, isOpen) {
  const triggerElRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    triggerElRef.current = document.activeElement;

    const container = containerRef.current;
    if (container) {
      const focusables = container.querySelectorAll(FOCUSABLE_SELECTOR);
      (focusables[0] || container).focus();
    }

    function handleKeyDown(e) {
      if (e.key !== 'Tab' || !containerRef.current) return;
      const focusables = Array.from(
        containerRef.current.querySelectorAll(FOCUSABLE_SELECTOR),
      ).filter(el => el.offsetParent !== null);
      if (focusables.length === 0) {
        e.preventDefault();
        containerRef.current.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      triggerElRef.current?.focus?.();
    };
  }, [isOpen, containerRef]);
}
