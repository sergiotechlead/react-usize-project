import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SkipToContent from '../components/SkipToContent';
import PageLoadingFallback from './PageLoadingFallback';
import DashboardSkeleton from '../pages/Dashboard/DashboardSkeleton';
import { DASHBOARD_SECTIONS } from '../pages/Dashboard/dashboardSections';

const HomePage        = lazy(() => import('../pages/Home/HomePage'));
const LoginPage        = lazy(() => import('../pages/Login/LoginPage'));
const RegisterPage     = lazy(() => import('../pages/Register/RegisterPage'));
const PricingPage      = lazy(() => import('../pages/Pricing/PricingPage'));
const DocsPage         = lazy(() => import('../pages/Docs/DocsPage'));
const ContactPage      = lazy(() => import('../pages/Contact/ContactPage'));
const DashboardPage    = lazy(() => import('../pages/Dashboard/DashboardPage'));
const AcceptInvitePage = lazy(() => import('../pages/AcceptInvite/AcceptInvitePage'));
const NotFoundPage     = lazy(() => import('../pages/NotFound/NotFoundPage'));

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SkipToContent />
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          <Route path="/"          element={<HomePage />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/register"  element={<RegisterPage />} />
          <Route path="/pricing"   element={<PricingPage />} />
          <Route path="/docs"      element={<DocsPage />} />
          <Route path="/contact"   element={<ContactPage />} />
          {/* Legacy/bare entry point (post-login redirect target, external
              links) — sends straight to the Overview section's own route. */}
          <Route path="/dashboard" element={<Navigate to="/dashboard-overview" replace />} />
          {DASHBOARD_SECTIONS.map(({ slug }) => (
            <Route
              key={slug}
              path={`/dashboard-${slug}`}
              element={
                <ProtectedRoute>
                  {/* Dedicated inner Suspense boundary: while the Dashboard's own
                      JS chunk (tfjs/xlsx/dnd-kit-heavy) is still downloading, this
                      shows the layout-matching DashboardSkeleton instead of the
                      generic spinner used by every other route above. */}
                  <Suspense fallback={<DashboardSkeleton />}>
                    <DashboardPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          ))}
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
          <Route path="*"          element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

export default App;
