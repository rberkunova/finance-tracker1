// src/components/Layout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
// import Navbar from './Navbar'; // Приклад навігаційної панелі
// import Footer from './Footer'; // Приклад футера

const Layout: React.FC = () => {
  return (
    <div className="app-layout">
      {/* <Navbar /> */}
      <header className="bg-gray-800 text-white p-4 text-center">
        <h1>My Finance Tracker</h1>
        {/* Тут може бути ваша навігаційна панель, якщо вона частина Layout */}
      </header>
      <main className="container mx-auto p-4">
        <Outlet /> {/* ВАЖЛИВО: Дочірні маршрути будуть рендеритися тут */}
      </main>
      <footer className="bg-gray-200 text-center p-4 mt-8">
        <p>&copy; {new Date().getFullYear()} Finance Tracker</p>
      </footer>
    </div>
  );
};

export default Layout;