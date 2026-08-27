import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Layouts (loaded eagerly as they are lightweight shells)
import MarketingLayout from './layouts/MarketingLayout';
import AppLayout from './layouts/AppLayout';
import ClientLayout from './layouts/ClientLayout';
import RequireAuth from './components/RequireAuth';

const Login = lazy(() => import('./pages/Auth/Login'));

// Lazy loaded pages to optimize bundle size
const Home = lazy(() => import('./pages/Marketing/Home'));
const Features = lazy(() => import('./pages/Marketing/Features'));
const Integrations = lazy(() => import('./pages/Marketing/Integrations'));
const Pricing = lazy(() => import('./pages/Marketing/Pricing'));
const About = lazy(() => import('./pages/Marketing/About'));
const Contact = lazy(() => import('./pages/Marketing/Contact'));
const TrustCenter = lazy(() => import('./pages/Marketing/TrustCenter'));
const PrivacyPolicy = lazy(() => import('./pages/Marketing/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/Marketing/Terms'));

// App (Dashboard) Pages
const DashboardOverview = lazy(() => import('./pages/App/DashboardOverview'));
const AiInsightsList = lazy(() => import('./pages/App/AiInsightsList'));
const Datasets = lazy(() => import('./pages/App/Datasets'));
const Reports = lazy(() => import('./pages/App/Reports'));
const AuditLogs = lazy(() => import('./pages/App/AuditLogs'));
const Models = lazy(() => import('./pages/App/Models'));

const AiInsightsDetail = lazy(() => import('./pages/App/AiInsightsDetail'));
const Patients = lazy(() => import('./pages/App/Patients'));
const PatientDetail = lazy(() => import('./pages/App/PatientDetail'));
const ClientDashboard = lazy(() => import('./pages/Client/ClientDashboard'));
const Onboarding = lazy(() => import('./pages/Client/Onboarding'));
const HandScanner = lazy(() => import('./pages/Client/HandScanner'));
const WearableCallback = lazy(() => import('./pages/Client/WearableCallback'));

// Simple loading fallback
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '48px' }}>
    <div style={{ color: 'var(--teal)', fontSize: '18px', fontWeight: 'bold' }}>Loading...</div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Marketing Routes */}
          <Route path="/" element={<MarketingLayout />}>
            <Route index element={<Home />} />
            <Route path="product" element={<Features />} />
            <Route path="how-it-works" element={<Integrations />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="trust" element={<TrustCenter />} />
            <Route path="legal">
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="terms" element={<Terms />} />
            </Route>
          </Route>

          {/* Auth */}
          <Route path="/login" element={<Login />} />

          {/* App (Dashboard) Routes */}
          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardOverview />} />
            <Route path="datasets" element={<Datasets />} />
            <Route path="ai-insights">
              <Route index element={<AiInsightsList />} />
              <Route path=":id" element={<AiInsightsDetail />} />
            </Route>
            <Route path="reports" element={<Reports />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="models" element={<Models />} />
            <Route path="patients">
              <Route index element={<Patients />} />
              <Route path=":id" element={<PatientDetail />} />
            </Route>
          </Route>

          {/* Client (Patient Portal) Routes */}
          <Route path="/client" element={<ClientLayout />}>
            <Route index element={<Navigate to="/client/onboard" replace />} />
            <Route path="onboard" element={<Onboarding />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="scan" element={<HandScanner />} />
            <Route path="wearables/callback" element={<WearableCallback />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
