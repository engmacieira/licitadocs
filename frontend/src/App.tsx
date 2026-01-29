import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/Login';
import { DocumentsPage } from './pages/Documents';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { AIChatPage } from './pages/AIChat';
import { CompaniesPage } from './pages/Admin/Companies';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rota Pública */}
          <Route path="/" element={<LoginPage />} />

          {/* Rotas Privadas */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* 🎯 ROTAS CORRIGIDAS (Sem duplicatas) */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/ai-chat" element={<AIChatPage />} />
            <Route path="/admin/companies" element={<CompaniesPage />} />

            {/* Redireciona rotas perdidas para o dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;