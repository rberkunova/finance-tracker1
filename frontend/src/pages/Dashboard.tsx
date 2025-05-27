// src/pages/Dashboard.tsx
import React from 'react';
import { useTransactions } from '../hooks/useTransactions'; // Для StatsCard, TransactionChart та AddTransaction
import { useGoals } from '../hooks/useGoals'; // Тільки для отримання стану loading/error, якщо потрібно для загального UI
import Header from '../components/Header';
import StatsCard from '../components/Dashboard/StatsCard';
import TransactionChart from '../components/Dashboard/TransactionChart';
import AddTransaction from '../components/Dashboard/AddTransaction';
import RecentTransactions from '../components/Dashboard/RecentTransactions'; // Тепер сам керує своїми даними
import FinancialGoals from '../components/Dashboard/FinancialGoals';     // Тепер сам керує своїми даними

const Dashboard: React.FC = () => {
  // useTransactions тут використовується для компонентів, які потребують
  // загального огляду (summary), можливості додати транзакцію, або даних для графіка.
  // RecentTransactions тепер сам викликає useTransactions.
  const {
    summary,          // Для StatsCard
    transactions,     // Для TransactionChart (якщо він все ще тут, або теж може використовувати свій хук)
    loading: txLoadingHook, // Перейменовано, щоб уникнути конфлікту
    error: txErrorHook,     // Перейменовано
    addTransaction,     // Для форми AddTransaction
    refreshTransactions, // Для кнопки Retry у випадку помилки завантаження summary/chart
  } = useTransactions();

  // useGoals тут може використовуватися, якщо потрібно відображати глобальний стан завантаження
  // або помилки для секції цілей на рівні Dashboard.
  // Сам компонент FinancialGoals буде використовувати useGoals для отримання списку цілей.
  const { loading: goalsLoadingHook, error: goalsErrorHook } = useGoals(); 
  
  // Загальний стан завантаження для сторінки, якщо є компоненти, що залежать від різних хуків
  const pageOverallLoading = txLoadingHook || goalsLoadingHook;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header /> {/* Хедер для навігації по секціях */}
      
      <main className="flex-grow container mx-auto p-4 md:p-6 space-y-10 md:space-y-16">
        
        {/* Загальний індикатор завантаження, якщо хоча б один з основних хуків завантажує дані */}
        {pageOverallLoading && (
          <div className="flex justify-center items-center h-64 text-xl text-gray-600">
            Loading dashboard data...
          </div>
        )}

        {/* Відображення помилки завантаження транзакцій (для summary/chart) */}
        {!pageOverallLoading && txErrorHook && (
          <div className="my-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded">
            <p className="font-semibold">Error loading transaction data:</p>
            <p>{txErrorHook}</p>
            <button 
              onClick={refreshTransactions} 
              className="mt-2 px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Retry Loading Transactions
            </button>
          </div>
        )}
        
        {/* Відображення помилки завантаження цілей (якщо хук useGoals повертає error) */}
        {!pageOverallLoading && goalsErrorHook && (
          <div className="my-4 p-4 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded">
            <p className="font-semibold">Note on Goals:</p>
            <p>{goalsErrorHook} (This section might be using placeholder data or encountered an issue.)</p>
            {/* Можна додати кнопку Retry для refreshGoals, якщо вона є в useGoals */}
          </div>
        )}

        {/* Секція "Overview" (Home) - використовує summary з useTransactions */}
        {/* Показуємо тільки якщо не було помилки завантаження транзакцій */}
        {!txLoadingHook && !txErrorHook && (
          <section id="overview" className="pt-4"> {/* id для react-scroll з Header */}
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4 md:mb-6">Overview</h2>
            <StatsCard summary={summary} />
          </section>
        )}

        {/* Секція "Transactions" */}
        <section id="transactions" className="pt-10 md:pt-16"> {/* id для react-scroll */}
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4 md:mb-6">Transactions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* TransactionChart може використовувати transactions з цього ж useTransactions,
                  або також мати свій екземпляр useTransactions, якщо йому потрібні інші параметри.
                  Поки що використовуємо transactions з цього Dashboard.
              */}
              {!txLoadingHook && transactions && transactions.length > 0 && (
                <TransactionChart transactions={transactions} />
              )}
              {/* RecentTransactions тепер сам завантажує та керує своїми транзакціями */}
              <RecentTransactions /> 
            </div>
            <div className="lg:col-span-1">
              {/* AddTransaction використовує функцію addTransaction з useTransactions цього Dashboard */}
              <AddTransaction onAdd={addTransaction} />
            </div>
          </div>
        </section>
        
        {/* Секція "Goals" */}
        <section id="goals" className="pt-10 md:pt-16"> {/* id для react-scroll */}
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4 md:mb-6">Financial Goals</h2>
          {/* FinancialGoals тепер сам завантажує та керує своїми цілями */}
          <FinancialGoals />
        </section>
      </main>
    </div>
  );
};

export default Dashboard;