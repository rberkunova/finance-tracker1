// src/components/Header.tsx
import React from 'react';
import { Link } from 'react-scroll';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { logout } = useAuth()

  return (
    <header className="bg-indigo-600 text-white p-4 flex justify-between items-center">
      <nav className="space-x-6">
        {/* Пакет react-scroll дає нам плавний скрол */}
        <Link to="home" smooth duration={300} className="cursor-pointer hover:underline">
          Home
        </Link>
        <Link to="transactions" smooth duration={300} className="cursor-pointer hover:underline">
          Transactions
        </Link>
        <Link to="goals" smooth duration={300} className="cursor-pointer hover:underline">
          Goals
        </Link>
      </nav>
      <button onClick={logout} className="underline">
        Logout
      </button>
    </header>
  )
}

export default Header