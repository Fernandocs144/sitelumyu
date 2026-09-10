import React, { useEffect, lazy, Suspense } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';

import './App.css';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from './i18n';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CommercialAgentWidget from './components/CommercialAgentWidget';
import CookieConsent from './components/CookieConsent';

import Home from './pages/Home';

// Secondary routes dynamically imported for code splitting
const Solutions = lazy(() => import('./pages/Solutions'));
const CaseStudies = lazy(() => import('./pages/CaseStudies'));
const Studio = lazy(() => import('./pages/Studio'));
const Contact = lazy(() => import('./pages/Contact'));
const Websites = lazy(() => import('./pages/solutions/Websites'));
const Automation = lazy(() => import('./pages/solutions/Automation'));
const ArtificialIntelligence = lazy(() => import('./pages/solutions/ArtificialIntelligence'));
const DigitalGrowth = lazy(() => import('./pages/solutions/DigitalGrowth'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Cookies = lazy(() => import('./pages/Cookies'));
const Terms = lazy(() => import('./pages/Terms'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin pages and infrastructure
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminPipelinePage = lazy(() => import('./pages/admin/AdminPipelinePage'));
const AdminLeadsPage = lazy(() => import('./pages/admin/AdminLeadsPage'));
const AdminLeadDetailPage = lazy(() => import('./pages/admin/AdminLeadDetailPage'));
const AdminTasksPage = lazy(() => import('./pages/admin/AdminTasksPage'));
const AdminFollowUpsPage = lazy(() => import('./pages/admin/AdminFollowUpsPage'));
const AdminConversationsPage = lazy(() => import('./pages/admin/AdminConversationsPage'));
const AdminConversationDetailPage = lazy(() => import('./pages/admin/AdminConversationDetailPage'));
const AdminBookingsPage = lazy(() => import('./pages/admin/AdminBookingsPage'));

import { AdminAuthProvider } from './context/AdminAuthContext';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'instant',
    });
  }, [pathname]);

  return null;
}


function ConditionalFooter() {
  const { pathname } = useLocation();

  if (pathname === '/' || pathname.startsWith('/admin')) {
    return null;
  }

  return <Footer />;
}


function AppContent() {
  const { pathname } = useLocation();

  const isHome = pathname === '/';
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#070513]" aria-hidden="true" />}>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="pipeline" element={<AdminPipelinePage />} />
            <Route path="leads" element={<AdminLeadsPage />} />
            <Route path="leads/:id" element={<AdminLeadDetailPage />} />
            <Route path="tarefas" element={<AdminTasksPage />} />
            <Route path="follow-ups" element={<AdminFollowUpsPage />} />
            <Route path="conversas" element={<AdminConversationsPage />} />
            <Route path="conversas/:id" element={<AdminConversationDetailPage />} />
            <Route path="reunioes" element={<AdminBookingsPage />} />
            <Route path="*" element={<AdminDashboardPage />} />
          </Route>
        </Routes>
      </Suspense>
    );
  }

  return (
    <div
      className={`
        min-h-screen
        font-body
        text-white
        ${isHome ? 'bg-ink' : ''}
      `}
      style={
        isHome
          ? undefined
          : {
              background:
                `
                  radial-gradient(
                    circle at 18% 45%,
                    rgba(219, 0, 126, 0.18),
                    transparent 38%
                  ),
                  radial-gradient(
                    circle at 82% 48%,
                    rgba(58, 67, 220, 0.22),
                    transparent 42%
                  ),
                  linear-gradient(
                    90deg,
                    #12051d 0%,
                    #130923 45%,
                    #11163d 100%
                  )
                `,
            }
      }
    >
      <ScrollToTop />

      <Navbar />

      <main>
        <Suspense fallback={<div className="min-h-screen" aria-hidden="true" />}>
          <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/solutions" element={<Solutions />} />
            <Route path="/solutions/websites" element={<Websites />} />
            <Route path="/solutions/automation" element={<Automation />} />
            <Route path="/solutions/ai" element={<ArtificialIntelligence />} />
            <Route path="/solutions/growth" element={<DigitalGrowth />} />

            <Route path="/case-studies" element={<CaseStudies />} />
            <Route path="/studio" element={<Studio />} />

            <Route path="/contact" element={<Contact />} />

            <Route path="/privacy" element={<Privacy />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/terms" element={<Terms />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <ConditionalFooter />

      <CommercialAgentWidget />
      <CookieConsent />
    </div>
  );
}


function App() {
  return (
    <HelmetProvider>
      <LanguageProvider>
        <AdminAuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AdminAuthProvider>
      </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;
