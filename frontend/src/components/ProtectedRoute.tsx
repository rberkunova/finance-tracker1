// src/components/Auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Перевірте шлях!

const ProtectedRoute = () => {
  // Використовуємо initialLoading для перевірки початкового стану автентифікації
  const { isAuthenticated, initialLoading } = useAuth(); 
  const location = useLocation();

  if (initialLoading) { // <--- Змінено з loading на initialLoading
    return <div className="flex justify-center items-center h-screen">Loading authentication status...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;