import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { MoreDrawer } from './components/MoreDrawer';

// Pages
import { Home } from './pages/Home';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Deliveries } from './pages/Deliveries';
import { Customers } from './pages/Customers';
import { Billing } from './pages/Billing';
import { Products } from './pages/Products';
import { Payments } from './pages/Payments';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Determine current session based on time (6 AM - 3 PM is morning, otherwise evening)
  const currentHour = new Date().getHours();
  const estimatedSession: 'MORNING' | 'EVENING' = (currentHour >= 6 && currentHour < 15) ? 'MORNING' : 'EVENING';

  // Extract titles or settings if needed
  const isPublicPage = ['/', '/login', '/register'].includes(location.pathname);

  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="app-container">
      <Sidebar />
      
      <Header 
        businessName="Liter" 
        session={estimatedSession}
        onMenuClick={() => setDrawerOpen(true)} 
      />
      
      <div className="app-main-wrapper" style={{ display: 'flex', flex: 1, width: '100%' }}>
        <BottomNav onMoreClick={() => setDrawerOpen(true)} />
        
        <main className="main-content">
          {children}
        </main>
      </div>

      <MoreDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
};

export const AppContent: React.FC = () => {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/delivery" element={
            <ProtectedRoute>
              <Deliveries />
            </ProtectedRoute>
          } />
          
          <Route path="/customers" element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          } />
          
          <Route path="/billing" element={
            <ProtectedRoute>
              <Billing />
            </ProtectedRoute>
          } />

          <Route path="/products" element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } />

          <Route path="/payments" element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          {/* Catch all / Redirects to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
