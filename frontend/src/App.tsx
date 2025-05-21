// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout'; 
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';

const PublicRouteWrapper = ({ children }: { children: JSX.Element }) => {
  // Використовуємо initialLoading для перевірки початкового стану автентифікації
  const { isAuthenticated, initialLoading } = useAuth(); 

  if (initialLoading) { // <--- Змінено з loading на initialLoading
    return <div className="flex justify-center items-center h-screen">Loading application state...</div>;
  }
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRouteWrapper>
                <Login />
              </PublicRouteWrapper>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRouteWrapper>
                <Register />
              </PublicRouteWrapper>
            }
          />
          <Route element={<Layout />}>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
export default App;