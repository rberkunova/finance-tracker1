// frontend/src/components/Dashboard/StatsCard.tsx
import React from 'react';

interface StatsCardProps {
  overallBalance?: number | null;
  monthIncome?: number | null;
  monthExpense?: number | null;
  loading?: boolean; // Додано стан завантаження
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  overallBalance, 
  monthIncome, 
  monthExpense,
  loading
}) => {
  const formatMoney = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return '$0.00'; // Повертаємо $0.00 якщо немає даних або не число
    }
    return `$${Number(value).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-md h-[120px]"> {/* Фіксована висота для скелетону */}
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-400 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <h3 className="text-lg font-medium text-gray-600">Income (Current Month)</h3>
        <p className="mt-2 text-3xl font-bold text-green-600">
          {formatMoney(monthIncome)}
        </p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <h3 className="text-lg font-medium text-gray-600">Expenses (Current Month)</h3>
        <p className="mt-2 text-3xl font-bold text-red-600">
          {formatMoney(monthExpense)}
        </p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <h3 className="text-lg font-medium text-gray-600">Total Current Balance</h3>
        <p className={`mt-2 text-3xl font-bold ${
          (overallBalance ?? 0) >= 0 ? 'text-blue-600' : 'text-red-600'
        }`}>
          {formatMoney(overallBalance)}
        </p>
      </div>
    </div>
  );
};

export default StatsCard;