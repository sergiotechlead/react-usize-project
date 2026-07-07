import { useTranslation } from 'react-i18next';

/**
 * WCAG 2.4.1 (Bypass Blocks) skip link. Rendered once at the very top of the
 * router in App.js. Visually hidden until it receives keyboard focus (see
 * `.skip-link` / `.skip-link:focus` in styles-product.css), then jumps to
 * whatever element on the current page has `id="main-content"`.
 */
export default function SkipToContent() {
  const { t } = useTranslation('common');
  return (
    <a href="#main-content" className="skip-link">
      {t('a11y.skipToContent')}
    </a>
  );
}
