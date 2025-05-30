// frontend/src/hooks/useAnalytics.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { MonthlySummary, CategoryExpense } from '../types/types';
import { useAuth } from '../context/AuthContext'; // Переконайтесь, що шлях правильний
import {
  getMonthlySummaryData,
  getCategoryExpensesData,
} from '../services/transactionService'; // Переконайтесь, що шлях правильний

export interface UseAnalyticsReturn {
  monthlySummary: MonthlySummary | null;
  categoryExpenses: CategoryExpense[];
  loading: boolean;
  error: string | null;
  refreshAnalytics: () => Promise<void>;
}

export const useAnalytics = (dataVersion?: number): UseAnalyticsReturn => {
  const { token, user, isAuthenticated, initialLoading: authInitialLoading } = useAuth(); // Додано authInitialLoading
  const userId = user?.id;

  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([]);
  const [loading, setLoading] = useState(true); // Починаємо з true
  const [error, setError] = useState<string | null>(null);
  const prevDataVersionRef = useRef(dataVersion);

  const fetchAnalyticsData = useCallback(async (context = "generic") => {
    if (authInitialLoading) { // Не починаємо завантаження, якщо автентифікація ще завантажується
      console.log(`useAnalytics (${context}): Auth is still initially loading. Skipping fetch.`);
      return;
    }
    if (!isAuthenticated || !token || !userId) {
      console.log(`useAnalytics (${context}): Not authenticated or no user ID. Clearing data.`);
      setMonthlySummary(null);
      setCategoryExpenses([]);
      setLoading(false); // Важливо встановити loading в false
      setError(null); // Скидаємо помилку, якщо була
      return;
    }
    console.log(`useAnalytics (${context}): Fetching analytics data (userId: ${userId})`);
    setLoading(true);
    setError(null);
    try {
      // Паралельно запитуємо дані
      const [monthlyData, categoryData] = await Promise.all([
        getMonthlySummaryData(token, userId),
        getCategoryExpensesData(token, userId),
      ]);
      setMonthlySummary(monthlyData);
      setCategoryExpenses(categoryData || []); // Гарантуємо, що це масив
      console.log(`useAnalytics (${context}): Analytics data fetched successfully.`);
    } catch (err: any) {
      console.error(`useAnalytics (${context}): Error fetching analytics data:`, err);
      setError(err.message || 'Failed to load analytics data');
      setMonthlySummary(null);
      setCategoryExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, userId, authInitialLoading]); // Додано authInitialLoading

  // Початкове завантаження та реакція на зміну стану автентифікації
  useEffect(() => {
    // authInitialLoading гарантує, що ми не викликаємо fetch до того, як auth стан визначено
    if (!authInitialLoading) {
      console.log("useAnalytics: Auth initialized. Triggering fetchAnalyticsData.");
      fetchAnalyticsData("initial/authChange");
    }
  }, [authInitialLoading, fetchAnalyticsData]); // Залежність від fetchAnalyticsData для оновлення, якщо його залежності (auth) змінились

  // Реакція на зміну dataVersion (з зовнішнього джерела, наприклад, після додавання транзакції)
  useEffect(() => {
    if (dataVersion !== undefined && dataVersion !== prevDataVersionRef.current && !authInitialLoading) {
      console.log(`useAnalytics: dataVersion prop changed from ${prevDataVersionRef.current} to ${dataVersion}. Triggering refresh.`);
      fetchAnalyticsData("dataVersionChange");
    }
    prevDataVersionRef.current = dataVersion;
  }, [dataVersion, fetchAnalyticsData, authInitialLoading]);

  return {
    monthlySummary,
    categoryExpenses,
    loading,
    error,
    refreshAnalytics: () => fetchAnalyticsData("manualRefresh"),
  };
};