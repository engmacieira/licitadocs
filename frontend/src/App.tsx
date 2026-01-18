import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/Login';
import { DocumentsPage } from './pages/Documents';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';

// Páginas Temporárias (Placeholder)
const Documents = () => <h1 className="text-2xl font-bold">Meus Documentos 📂</h1>;
const AIChat = () => <h1 className="text-2xl font-bold">Consultor IA 🤖</h1>;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rota Pública */}
          <Route path="/" element={<LoginPage />} />

          {/* Rotas Privadas (Envelopadas pelo Layout) */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* O Outlet vai renderizar um desses dependendo da URL */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/ai-chat" element={<AIChat />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/documents" element={<DocumentsPage />} />

            {/* Redireciona qualquer rota perdida dentro do painel para o dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;