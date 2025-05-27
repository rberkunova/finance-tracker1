// src/components/Layout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';

// Цей Layout тепер є обгорткою для сторінок, що рендеряться через ProtectedRoute.
// Наш Dashboard тепер сам містить свій Header.
const Layout: React.FC = () => {
  return (
    <div className="app-layout-wrapper min-h-screen bg-gray-50"> 
      {/* Якщо у вас є елементи, спільні для ВСІХ захищених сторінок (не тільки Dashboard),
        наприклад, глобальна бічна панель або інший тип хедера/футера, їх можна розмістити тут.
        Але для поточного завдання з односторінковим Dashboard, Header знаходиться всередині Dashboard.tsx.
      */}
      <Outlet /> {/* Тут буде рендеритися Dashboard або інші захищені сторінки */}
    </div>
  );
};

export default Layout;