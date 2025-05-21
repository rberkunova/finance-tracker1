// src/pages/Dashboard.tsx
import React from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { useGoals } from '../hooks/useGoals'
import StatsCard from '../components/Dashboard/StatsCard'
import TransactionChart from '../components/Dashboard/TransactionChart'
import AddTransaction from '../components/Dashboard/AddTransaction'
import RecentTransactions from '../components/Dashboard/RecentTransactions'
import FinancialGoals from '../components/Dashboard/FinancialGoals'

const Dashboard = () => {
  // деструктуруємо addTransaction
  const {
    transactions,
    summary,
    loading: txLoading,
    error: txError,
    addTransaction,
    refreshTransactions,
  } = useTransactions()

  const { goals, loading: goalsLoading, error: goalsError, refreshGoals } = useGoals()

  // показуємо індикатор, якщо дані ще завантажуються
  if (txLoading || goalsLoading) {
    return <div className="flex justify-center items-center h-screen">Loading…</div>
  }

  // можна показати помилки, якщо вони є
  if (txError) {
    return <div className="text-red-600 p-4">Transactions error: {txError}</div>
  }
  if (goalsError) {
    return <div className="text-red-600 p-4">Goals error: {goalsError}</div>
  }

  return (
    <div className="space-y-16">
      {/* OVERVIEW */}
      <section id="home">
        <StatsCard summary={summary} />
      </section>

      {/* TRANSACTIONS */}
      <section id="transactions" className="space-y-8">
        <h2 className="text-2xl font-bold">Transactions</h2>
        <TransactionChart transactions={transactions} />
        <RecentTransactions transactions={transactions} />
        {/* Ось сюди передаємо addTransaction */}
        <AddTransaction onAdd={addTransaction} />
      </section>

      {/* GOALS */}
      <section id="goals" className="space-y-8">
        <h2 className="text-2xl font-bold">Goals</h2>
        <FinancialGoals goals={goals} />
      </section>
    </div>
  )
}

export default Dashboard