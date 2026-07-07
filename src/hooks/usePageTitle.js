import { useEffect } from 'react';

/**
 * Sets `document.title` for the current page (WCAG 2.4.2 Page Titled).
 * Plain `useEffect` + native DOM API — no react-helmet per project constraints.
 * Re-runs whenever `title` changes (e.g. i18n language switch, or a
 * dynamically-composed title such as the Dashboard's active section).
 *
 * @param {string} title fully-composed, already-translated page title.
 */
export function usePageTitle(title) {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
