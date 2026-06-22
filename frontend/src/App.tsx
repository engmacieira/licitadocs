import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { LEGAL_CONFIG } from './config/app.config';

// Contextos e Guards
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

// Layouts
import { MainLayout } from './components/layout/MainLayout';
import { PublicLayout } from './components/layout/PublicLayout';

// --- PÁGINAS ---

// Públicas / Institucionais
import { LandingPage } from './pages/LandingPage';
import { AboutPage } from './pages/About';
import { DemoPage } from './pages/Demo';
import { TermsOfUse } from './pages/Legal/TermsOfUse';
import { PrivacyPolicy } from './pages/Legal/PrivacyPolicy';

// Autenticação & Onboarding
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { ContractSignPage } from './pages/ContractSign';
import { PaymentPage } from './pages/Payment';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { ResetPasswordPage } from './pages/ResetPassword';

// Área do Cliente
import { Dashboard } from './pages/Client/Dashboard';
import { DocumentsPage } from './pages/Client/Documents';
import { CompanySettingsPage } from './pages/Client/Settings';
import { SignaturePage } from './pages/Client/Signature';
import { HelpCenterPage } from './pages/Client/HelpCenter';
import { DocumentTemplatesPage } from './pages/Client/DocumentTemplates';
import { VerifyEmailPage } from './pages/Client/VerifyEmail';

// Área do Administrador
import { AdminDashboardPage } from './pages/Admin/Dashboard';
import { AdminCompaniesPage } from './pages/Admin/Companies';
import { AdminCompanyDetailsPage } from './pages/Admin/CompanyDetails';
import { AdminUploadPage } from './pages/Admin/Upload';
import { SettingsPage } from './pages/Admin/Settings';
import { AdminInboxPage } from './pages/Admin/Inbox';
import { ValidityMonitorPage } from './pages/Admin/ValidityMonitor';
import { AdminEmissionRulesPage } from './pages/Admin/EmissionRules';
import { ManualEmissionPage } from './pages/Admin/ManualEmission';
import { AdminAuditLogsPage } from './pages/Admin/AuditLogs';

function App() {
  return (
    <BrowserRouter>
      {/* Feedback Visual Global (Toasts) */}
      <Toaster richColors position="top-right" closeButton />

      <ErrorBoundary>
        <AuthProvider>
          <Routes>
            {/* =========================================================
                ROTAS PÚBLICAS (Acesso Livre)
            ========================================================= */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/demonstracao" element={<DemoPage />} />

            <Route element={<PublicLayout />}>
              <Route path="/sobre" element={<AboutPage />} />
              <Route path={LEGAL_CONFIG.termsOfUseUrl} element={<TermsOfUse />} />
              <Route path={LEGAL_CONFIG.privacyPolicyUrl} element={<PrivacyPolicy />} />
            </Route>

            {/* Fluxo de Onboarding (Geralmente acessível via Token ou logo após registro) */}
            <Route path="/contract-sign" element={<ContractSignPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* =========================================================
              ROTAS PROTEGIDAS (Requer Login + Token)
          ========================================================= */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* --- CLIENTE (Empresas) --- */}
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

              {/* Gestão de Empresas */}
              <Route path="/admin/companies" element={<AdminCompaniesPage />} />
              <Route path="/admin/companies/:id" element={<AdminCompanyDetailsPage />} />
              <Route path="/admin/validity-monitor" element={<ValidityMonitorPage />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* Fallback: Rota 404 ou Redirecionamento */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;