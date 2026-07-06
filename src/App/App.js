import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HomePage      from '../pages/Home/HomePage';
import LoginPage     from '../pages/Login/LoginPage';
import RegisterPage  from '../pages/Register/RegisterPage';
import PricingPage   from '../pages/Pricing/PricingPage';
import DocsPage      from '../pages/Docs/DocsPage';
import ContactPage   from '../pages/Contact/ContactPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import AcceptInvitePage from '../pages/AcceptInvite/AcceptInvitePage';
import NotFoundPage  from '../pages/NotFound/NotFoundPage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/"          element={<HomePage />} />
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/register"  element={<RegisterPage />} />
        <Route path="/pricing"   element={<PricingPage />} />
        <Route path="/docs"      element={<DocsPage />} />
        <Route path="/contact"   element={<ContactPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route path="*"          element={<NotFoundPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
