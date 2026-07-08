import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import './PageLoadingFallback.css';

// Generic Suspense fallback used for every lazy-loaded route except
// /dashboard (which gets the more detailed DashboardSkeleton instead —
// see src/pages/Dashboard/DashboardSkeleton.js). Reuses the same
// FontAwesomeIcon faSpinner "spin" pattern already used throughout the
// app (DashboardPage.js, HomePage.js, LoginPage.js, ContactPage.js, etc.)
// rather than inventing a new loading visual.
export default function PageLoadingFallback() {
  return (
    <div className="page-loading-fallback" role="status" aria-live="polite">
      <FontAwesomeIcon icon={faSpinner} spin className="page-loading-spinner" />
    </div>
  );
}
