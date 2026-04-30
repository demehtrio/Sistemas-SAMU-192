import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Login } from './Login';
import { Register } from './Register';
import { Dashboard, ErrorBoundary } from './Dashboard';
import { ChecklistDashboard } from './ChecklistDashboard';
import { Home } from './Home';
import { SamuLogo } from './components/SamuLogo';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-samu-red"></div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = React.useState<string | null>(null);

  const { user, loading, signOut } = useAuth();
  
  React.useEffect(() => {
    const handleErrorEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setGlobalError(customEvent.detail);
      setTimeout(() => setGlobalError(null), 8000);
    };
    const handleSuccessEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setGlobalSuccess(customEvent.detail);
      setTimeout(() => setGlobalSuccess(null), 5000);
    };
    window.addEventListener('show-error-toast', handleErrorEvent);
    window.addEventListener('show-success-toast', handleSuccessEvent);
    return () => {
      window.removeEventListener('show-error-toast', handleErrorEvent);
      window.removeEventListener('show-success-toast', handleSuccessEvent);
    };
  }, []);

  return (
    <div className="relative min-h-screen">
      {globalError && (
        <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-2xl flex items-start space-x-3">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-800">Aviso do Sistema</h3>
            <p className="mt-1 text-sm text-red-700 font-medium">{globalError}</p>
          </div>
          <button 
            onClick={() => setGlobalError(null)}
            className="text-red-400 hover:text-red-500 transition-colors font-bold p-1"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      )}

      {globalSuccess && (
        <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-2xl flex items-start space-x-3">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-green-800">Sucesso</h3>
            <p className="mt-1 text-sm text-green-700 font-medium">{globalSuccess}</p>
          </div>
          <button 
            onClick={() => setGlobalSuccess(null)}
            className="text-green-400 hover:text-green-500 transition-colors font-bold p-1"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      )}

      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Home />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/permutas"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Dashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/checklist"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <ChecklistDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
