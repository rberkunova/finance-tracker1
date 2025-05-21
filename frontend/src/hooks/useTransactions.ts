// src/hooks/useTransactions.ts
import { useState, useEffect, useCallback } from 'react';
import { Transaction, FinancialSummary } from '../types/types'; // Використовує оновлені типи
import { useAuth } from '../context/AuthContext';
import {
  createTransaction as apiCreateTransaction,
  getUserTransactions,
  getFinancialSummary,
} from '../services/transactionService';

export const useTransactions = () => {
  const { token, user, isAuthenticated } = useAuth();
  const userId = user?.id; // Це id користувача з AuthContext (має бути string)

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactionsAndSummary = useCallback(async () => {
    // user_id для запитів API має бути рядком, userId з AuthContext вже є рядком.
    if (!isAuthenticated || !token || !userId) {
      setTransactions([]);
      setSummary(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [fetchedTransactions, fetchedSummary] = await Promise.all([
        // getUserTransactions очікує userId (рядок), а не user_id (якщо API так приймає)
        // Якщо API /transactions/:userId очікує userId, то все добре.
        getUserTransactions(token, userId),
        getFinancialSummary(token, userId),
      ]);
      setTransactions(fetchedTransactions); // Тепер типи мають співпадати
      setSummary(fetchedSummary);           // Тепер типи мають співпадати
    } catch (err: any) {
      console.error("Failed to fetch transactions or summary:", err);
      setError(err.message || 'Failed to load transaction data.');
      setTransactions([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [token, userId, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchTransactionsAndSummary();
    } else {
      setTransactions([]);
      setSummary(null);
    }
  }, [isAuthenticated, userId, fetchTransactionsAndSummary]);

  const addTransaction = async (
    amount: number,
    type: 'income' | 'expense',
    category: string,
    description: string,
    transactionDate: string // Це transaction_date у форматі YYYY-MM-DD
  ): Promise<void> => {
    if (!isAuthenticated || !token || !userId) {
      const authError = 'Action requires authentication.';
      setError(authError);
      throw new Error(authError);
    }
     // Валідація дати залишається важливою
    if (!transactionDate || !new Date(transactionDate).toISOString().startsWith(transactionDate.substring(0,10)) ) {
        const dateError = 'Invalid transaction date provided. Expected YYYY-MM-DD.';
        setError(dateError);
        throw new Error(dateError);
    }

    setLoading(true);
    setError(null);
    try {
      // apiCreateTransaction тепер очікує userId (рядок), а не user_id
      // і transactionDate (рядок), а не transaction_date
      // Це залежить від того, як визначено apiCreateTransaction у transactionService.ts
      // Див. оновлення transactionService.ts нижче.
      await apiCreateTransaction(token, userId, amount, type, category, description, transactionDate);
      await fetchTransactionsAndSummary();
    } catch (err: any) {
      console.error("Failed to add transaction:", err);
      const errorMessage = err.message || 'Failed to add transaction. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    transactions,
    summary,
    loading,
    error,
    addTransaction,
    refreshTransactions: fetchTransactionsAndSummary,
  };
};