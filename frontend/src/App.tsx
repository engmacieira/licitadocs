import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Contextos e Guards
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
import { MainLayout } from './components/layout/MainLayout';

// --- PÁGINAS ---

// Públicas / Institucionais
import { LandingPage } from './pages/LandingPage';
import { AboutPage } from './pages/About';
import { DemoPage } from './pages/Demo';

// Autenticação & Onboarding
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { ContractSignPage } from './pages/ContractSign'; // Fluxo de entrada
import { PaymentPage } from './pages/Payment';         // Fluxo de entrada

// Área do Cliente
import { Dashboard } from './pages/Client/Dashboard';
import { DocumentsPage } from './pages/Client/Documents';
import { CompanySettings } from './pages/Client/CompanySettings';

// Área do Administrador
import { AdminDashboard } from './pages/Admin/Dashboard';
import { AdminCompaniesPage } from './pages/Admin/Companies';
import { AdminCompanyDetails } from './pages/Admin/CompanyDetails';
import { AdminUploadPage } from './pages/Admin/Upload';
import { SettingsPage } from './pages/Admin/Settings';

function App() {
  return (
    <BrowserRouter>
      {/* Feedback Visual Global (Toasts) */}
      <Toaster richColors position="top-right" closeButton />

      <AuthProvider>
        <Routes>
          {/* =========================================================
              ROTAS PÚBLICAS (Acesso Livre)
          ========================================================= */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/demonstracao" element={<DemoPage />} />
          <Route path="/sobre" element={<AboutPage />} />

          {/* Fluxo de Onboarding (Geralmente acessível via Token ou logo após registro) */}
          <Route path="/contract-sign" element={<ContractSignPage />} />
          <Route path="/payment" element={<PaymentPage />} />

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
            <Route path="/company-settings" element={<CompanySettings />} />

            {/* --- ADMINISTRADOR (Backoffice) --- */}
            {/* Dica: Futuramente você pode criar um wrapper <AdminRoute> aqui */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/upload" element={<AdminUploadPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />

            {/* Gestão de Empresas */}
            <Route path="/admin/companies" element={<AdminCompaniesPage />} />
            <Route path="/admin/companies/:id" element={<AdminCompanyDetails />} />

            {/* Fallback: Rota 404 ou Redirecionamento */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;