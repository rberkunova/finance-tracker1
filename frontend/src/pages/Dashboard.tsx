// src/pages/Dashboard.tsx
import React from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useAnalytics } from '../hooks/useAnalytics'; // <-- НОВИЙ ХУК

import Header from '../components/Header';
import StatsCard from '../components/Dashboard/StatsCard';
import TransactionChart from '../components/Dashboard/TransactionChart';
import AddTransaction from '../components/Dashboard/AddTransaction';
import RecentTransactions from '../components/Dashboard/RecentTransactions';
import FinancialGoals from '../components/Dashboard/FinancialGoals';
import CategoryPieChart from '../components/Dashboard/CategoryPieChart'; // <-- НОВИЙ КОМПОНЕНТ

const Dashboard: React.FC = () => {
  const {
    summary: overallSummary, // Загальний summary (з balance)
    transactions,          // Для TransactionChart
    loading: txLoading,    // Перейменовано для уникнення конфлікту
    error: txError,        // Перейменовано
    addTransaction,
    refreshTransactions,
    dataVersion,           // Для тригера оновлення дочірніх компонентів
  } = useTransactions();

  // Використовуємо dataVersion з useTransactions для тригера оновлення аналітики та цілей
  const { 
    monthlySummary, 
    categoryExpenses, 
    loading: analyticsLoading, 
    error: analyticsError,
    refreshAnalytics 
  } = useAnalytics(dataVersion); 
  
  // Загальний стан завантаження для основних даних дашборду
  const pageOverallLoading = txLoading || analyticsLoading;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-grow container mx-auto p-4 md:p-6 space-y-10 md:space-y-16">
        
        {pageOverallLoading && (
          <div className="fixed inset-0 bg-gray-700 bg-opacity-75 flex flex-col justify-center items-center z-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-400"></div>
            <p className="ml-3 mt-4 text-white text-xl">Loading dashboard data...</p>
          </div>
        )}

        {/* Блок для відображення помилок */}
        {!pageOverallLoading && (txError || analyticsError) && (
          <div className="my-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-lg shadow-sm">
            <p className="font-semibold text-lg mb-2">Oops! Something went wrong:</p>
            {txError && (
              <div className="mb-1">
                - Transactions/Summary: {txError} 
                <button onClick={refreshTransactions} className="ml-2 text-xs font-medium text-blue-600 hover:text-blue-800 underline">Retry</button>
              </div>
            )}
            {analyticsError && (
              <div>
                - Analytics Data: {analyticsError} 
                <button onClick={refreshAnalytics} className="ml-2 text-xs font-medium text-blue-600 hover:text-blue-800 underline">Retry</button>
              </div>
            )}
          </div>
        )}
        
        {/* Секція "Overview" з оновленими даними */}
        {/* Показуємо, тільки якщо основні дані завантажені без помилок */}
        {!txLoading && !analyticsError && ( // Використовуємо !txLoading, бо overallSummary залежить від useTransactions
          <section id="overview" className="pt-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4 md:mb-6">Overview</h2>
            <StatsCard 
              overallBalance={overallSummary?.balance} 
              monthIncome={monthlySummary?.monthIncome} // Дані з useAnalytics
              monthExpense={monthlySummary?.monthExpense} // Дані з useAnalytics
              loading={analyticsLoading || txLoading} // Передаємо стан завантаження
            />
          </section>
        )}

        {/* Розділ "Analytics & Transactions" */}
        <section id="analytics" className="pt-10 md:pt-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4 md:mb-6">Analytics & Transactions</h2>
          
          {/* Графіки та форма додавання транзакції */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Динаміка доходів та витрат (існуючий лінійний графік) */}
              {/* Він використовує transactions, які оновлюються через dataVersion */}
              <TransactionChart transactions={transactions} loading={txLoading} />

              {/* Графік витрат за категоріями (нова кругова діаграма) */}
              <CategoryPieChart categoryExpenses={categoryExpenses} loading={analyticsLoading} />
            </div>
            <div className="lg:col-span-1">
              <AddTransaction onAdd={addTransaction} />
            </div>
          </div>
          
          {/* Список останніх транзакцій */}
          <RecentTransactions dataVersion={dataVersion} /> 
        </section>
        
        <section id="goals" className="pt-10 md:pt-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4 md:mb-6">Financial Goals</h2>
          <FinancialGoals dataVersion={dataVersion} />
        </section>
      </main>
    </div>
  );
};

export default Dashboard;