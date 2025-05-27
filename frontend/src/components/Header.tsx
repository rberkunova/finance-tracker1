// src/components/Header.tsx
import React from 'react';
import { Link } from 'react-scroll'; // Переконайтесь, що встановлено: pnpm add react-scroll @types/react-scroll
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Явне перенаправлення після виходу
  };

  return (
    <header className="bg-indigo-700 text-white p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">
          Finance Tracker {user?.name && <span className="text-sm font-normal">({user.name})</span>}
        </div>
        <nav className="space-x-6">
          {/* "Home" посилається на секцію з id="overview" або "home" */}
          <Link to="overview" spy={true} smooth={true} offset={-70} duration={500} className="cursor-pointer hover:text-indigo-300 transition-colors">
            Overview
          </Link>
          <Link to="transactions" spy={true} smooth={true} offset={-70} duration={500} className="cursor-pointer hover:text-indigo-300 transition-colors">
            Transactions
          </Link>
          <Link to="goals" spy={true} smooth={true} offset={-70} duration={500} className="cursor-pointer hover:text-indigo-300 transition-colors">
            Goals
          </Link>
        </nav>
        <button 
          onClick={handleLogout} 
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;