import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Overview } from './pages/Overview';
import { N8nStatsComponent } from './pages/N8nStatsComponent.tsx';
import { PortfolioStats } from './pages/PortfolioStats';
import { ApiManagement } from './pages/ApiManagement';
import { Settings } from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return token ? <>{children}</> : <Navigate to="/login" />;
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Overview />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/n8n"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <N8nStatsComponent />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/portfolio"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PortfolioStats />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/api-tokens"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ApiManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
