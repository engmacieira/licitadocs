import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { lazy, Suspense } from 'react'; // 🟢 Importamos lazy e Suspense do React
import { LEGAL_CONFIG } from './config/app.config';

// --- ELEMENTOS ESTRUTURAIS (Carregamento Imediato/Estático) ---
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PostHogPageView } from './components/PostHogPageView';
import { MainLayout } from './components/layout/MainLayout';
import { PublicLayout } from './components/layout/PublicLayout';

// 🟢 Um componente de loading simples e leve para exibir durante a transição de telas
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// =========================================================
// 🚀 LAZY LOADING DAS PÁGINAS (Carregamento sob Demanda)
// =========================================================

// Modo Em Breve / Home
const ComingSoonPage = lazy(() => import('./pages/ComingSoon').then(m => ({ default: m.ComingSoonPage })));
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const AboutPage = lazy(() => import('./pages/About').then(m => ({ default: m.AboutPage })));
const DemoPage = lazy(() => import('./pages/Demo').then(m => ({ default: m.DemoPage })));
const TermsOfUse = lazy(() => import('./pages/Legal/TermsOfUse').then(m => ({ default: m.TermsOfUse })));
const PrivacyPolicy = lazy(() => import('./pages/Legal/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));

// Autenticação & Onboarding
const LoginPage = lazy(() => import('./pages/Login').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/Register').then(m => ({ default: m.RegisterPage })));
const ContractSignPage = lazy(() => import('./pages/ContractSign').then(m => ({ default: m.ContractSignPage })));
const PaymentPage = lazy(() => import('./pages/Payment').then(m => ({ default: m.PaymentPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPasswordPage })));
const VerifyEmailPage = lazy(() => import('./pages/Client/VerifyEmail').then(m => ({ default: m.VerifyEmailPage })));

// Área do Cliente
const Dashboard = lazy(() => import('./pages/Client/Dashboard').then(m => ({ default: m.Dashboard })));
const DocumentsPage = lazy(() => import('./pages/Client/Documents').then(m => ({ default: m.DocumentsPage })));
const CompanySettingsPage = lazy(() => import('./pages/Client/Settings').then(m => ({ default: m.CompanySettingsPage })));
const SignaturePage = lazy(() => import('./pages/Client/Signature').then(m => ({ default: m.SignaturePage })));
const HelpCenterPage = lazy(() => import('./pages/Client/HelpCenter').then(m => ({ default: m.HelpCenterPage })));
const DocumentTemplatesPage = lazy(() => import('./pages/Client/DocumentTemplates').then(m => ({ default: m.DocumentTemplatesPage })));

// Área do Administrador (Backoffice pesado)
const AdminDashboardPage = lazy(() => import('./pages/Admin/Dashboard').then(m => ({ default: m.AdminDashboardPage })));
const AdminCompaniesPage = lazy(() => import('./pages/Admin/Companies').then(m => ({ default: m.AdminCompaniesPage })));
const AdminCompanyDetailsPage = lazy(() => import('./pages/Admin/CompanyDetails').then(m => ({ default: m.AdminCompanyDetailsPage })));
const AdminUploadPage = lazy(() => import('./pages/Admin/Upload').then(m => ({ default: m.AdminUploadPage })));
const SettingsPage = lazy(() => import('./pages/Admin/Settings').then(m => ({ default: m.SettingsPage })));
const AdminInboxPage = lazy(() => import('./pages/Admin/Inbox').then(m => ({ default: m.AdminInboxPage })));
const ValidityMonitorPage = lazy(() => import('./pages/Admin/ValidityMonitor').then(m => ({ default: m.ValidityMonitorPage })));
const AdminEmissionRulesPage = lazy(() => import('./pages/Admin/EmissionRules').then(m => ({ default: m.AdminEmissionRulesPage })));
const ManualEmissionPage = lazy(() => import('./pages/Admin/ManualEmission').then(m => ({ default: m.ManualEmissionPage })));
const AdminAuditLogsPage = lazy(() => import('./pages/Admin/AuditLogs').then(m => ({ default: m.AdminAuditLogsPage })));

function App() {
  const isComingSoon = import.meta.env.VITE_COMING_SOON_MODE === 'true';

  return (
    <BrowserRouter>
      <PostHogPageView />
      <Toaster richColors position="top-right" closeButton />

      <ErrorBoundary>
        <AuthProvider>
          {/* 🟢 O Suspense garante que o PageLoader seja exibido enquanto o bundle da tela específica é baixado */}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* =========================================================
                  ROTAS PÚBLICAS (Acesso Livre)
              ========================================================= */}
              <Route path="/" element={isComingSoon ? <ComingSoonPage /> : <LandingPage />} />
              <Route path="/login" element={<LoginPage />} />

              <Route path="/register" element={isComingSoon ? <Navigate to="/" replace /> : <RegisterPage />} />
              <Route path="/demonstracao" element={isComingSoon ? <Navigate to="/" replace /> : <DemoPage />} />

              <Route element={isComingSoon ? <Navigate to="/" replace /> : <PublicLayout />}>
                <Route path="/sobre" element={<AboutPage />} />
                <Route path={LEGAL_CONFIG.termsOfUseUrl} element={<TermsOfUse />} />
                <Route path={LEGAL_CONFIG.privacyPolicyUrl} element={<PrivacyPolicy />} />
              </Route>

              {/* Fluxo de Onboarding */}
              <Route path="/contract-sign" element={isComingSoon ? <Navigate to="/" replace /> : <ContractSignPage />} />
              <Route path="/payment" element={isComingSoon ? <Navigate to="/" replace /> : <PaymentPage />} />

              {/* Recuperação de Senha */}
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />

              {/* =========================================================
                ROTAS PROTEGIDAS (Requer Login + Token)
              ========================================================= */}
              <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/company-settings" element={<CompanySettingsPage />} />
                <Route path="/signature" element={<SignaturePage />} />
                <Route path="/help-center" element={<HelpCenterPage />} />
                <Route path="/document-templates" element={<DocumentTemplatesPage />} />
              </Route>

              {/* --- ADMINISTRADOR (Backoffice) --- */}
              <Route element={<ProtectedRoute allowedRoles={['admin']}><MainLayout /></ProtectedRoute>}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/upload" element={<AdminUploadPage />} />
                <Route path="/admin/settings" element={<SettingsPage />} />
                <Route path="/admin/inbox" element={<AdminInboxPage />} />
                <Route path="/admin/emission-rules" element={<AdminEmissionRulesPage />} />
                <Route path="/admin/manual-emission/:ruleId" element={<ManualEmissionPage />} />
                <Route path="/admin/companies" element={<AdminCompaniesPage />} />
                <Route path="/admin/companies/:id" element={<AdminCompanyDetailsPage />} />
                <Route path="/admin/validity-monitor" element={<ValidityMonitorPage />} />
                <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
              </Route>

              <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;