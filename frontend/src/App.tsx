import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from 'sonner';

// Layouts e Pages
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { DocumentsPage } from './pages/Documents';
import { RegisterPage } from './pages/Register';
import { ContractSignPage } from './pages/ContractSign';
import { PaymentPage } from './pages/Payment';

// Admin Pages
import { CompaniesPage } from './pages/Admin/Companies';
import { AdminDashboard } from './pages/Admin/Dashboard';
import { UploadPage } from './pages/Admin/Upload';
import { CompanyDetails } from './pages/Admin/CompanyDetails';

function App() {
  return (
    <BrowserRouter>
      {/* Sistema de Notificações Global */}
      <Toaster richColors position="top-right" closeButton />

      <AuthProvider>
        <Routes>
          {/* Rota Pública */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/contract" element={<ContractSignPage />} />
          <Route path="/payment" element={<PaymentPage />} />

          {/* Rotas Protegidas (Requer Login) */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Rotas de Cliente */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/documents" element={<DocumentsPage />} />

            {/* O Chat agora é um Widget flutuante no MainLayout, não precisa de rota */}

            {/* Rotas de Admin */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/companies" element={<CompaniesPage />} />
            <Route path="/admin/upload" element={<UploadPage />} />
            <Route path="/admin/companies" element={<CompaniesPage />} />
            <Route path="/admin/companies/:id" element={<CompanyDetails />} />

            {/* Fallback: Qualquer rota desconhecida vai pro dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;