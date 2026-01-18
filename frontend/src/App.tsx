import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/Login'; // <--- Importe a página real

// Dashboard temporário (vamos fazer na próxima tarefa)
const Dashboard = () => (
  <div className="min-h-screen bg-green-50 flex items-center justify-center text-green-700 font-bold text-2xl">
    Painel Logado com Sucesso! 🚀
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} /> {/* <--- Use aqui */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;