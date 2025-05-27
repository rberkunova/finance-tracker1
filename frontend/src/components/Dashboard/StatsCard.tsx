// src/components/Dashboard/StatsCard.tsx
import React from 'react';
import { FinancialSummary } from '../../types/types';

interface StatsCardProps {
  summary: FinancialSummary | null;
}

const StatsCard: React.FC<StatsCardProps> = ({ summary }) => {
  // Якщо summary ще не завантажено або відсутнє, показуємо заглушку або нічого
  if (!summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-md">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-300 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  // Забезпечуємо значення за замовчуванням, якщо поля не визначені
  const totalIncome = summary.totalIncome ?? 0;
  const totalExpenses = summary.totalExpense ?? 0;
  const balance = summary.balance ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <h3 className="text-lg font-medium text-gray-600">Total Income</h3>
        <p className="mt-2 text-3xl font-bold text-green-600">
          ${totalIncome.toFixed(2)}
        </p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <h3 className="text-lg font-medium text-gray-600">Total Expenses</h3>
        <p className="mt-2 text-3xl font-bold text-red-600">
          ${totalExpenses.toFixed(2)}
        </p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <h3 className="text-lg font-medium text-gray-600">Current Balance</h3>
        <p className={`mt-2 text-3xl font-bold ${
          balance >= 0 ? 'text-blue-600' : 'text-red-600' // Змінено колір балансу
        }`}>
          ${balance.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default StatsCard;
