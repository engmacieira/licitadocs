import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/Login';
import { DocumentsPage } from './pages/Documents'; // A página REAL
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';

// O AIChat ainda não tem página real, então deixamos o placeholder
const AIChat = () => <h1 className="text-2xl font-bold">Consultor IA 🤖 (Em Breve)</h1>;

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
            <Route path="/documents" element={<DocumentsPage />} /> {/* Agora aponta para a CERTA! */}
            <Route path="/ai-chat" element={<AIChat />} />

            {/* Redireciona rotas perdidas para o dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;