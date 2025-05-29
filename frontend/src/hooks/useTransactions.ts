// frontend/src/hooks/useTransactions.ts
import { useState, useEffect, useCallback } from 'react';
import {
  Transaction,
  FinancialSummary,
  TransactionQueryParams,
} from '../types/types'; // Переконайтесь, що шлях правильний
import { useAuth } from '../context/AuthContext'; // Переконайтесь, що шлях правильний
import {
  createTransaction as apiCreateTransaction,
  getUserTransactions,
  getFinancialSummary,
  deleteTransaction as apiDeleteTransaction,
  PaginatedTransactionsResponse,
} from '../services/transactionService'; // Переконайтесь, що шлях правильний

export type AddTransactionFn = (
  amount: number,
  type: 'income' | 'expense',
  category: string,
  description: string,
  transactionDate: string,
) => Promise<void>;

export interface UseTransactionsReturn {
  transactions: Transaction[];
  summary: FinancialSummary | null;
  loading: boolean;
  error: string | null;
  addTransaction: AddTransactionFn;
  deleteTransaction: (transactionId: string) => Promise<void>;
  refreshTransactions: () => Promise<void>;
  queryParams: TransactionQueryParams;
  setQueryParams: (p: Partial<TransactionQueryParams>) => void;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  dataVersion: number; // <-- НОВЕ: Версія даних для тригера оновлення
}

export const useTransactions = (): UseTransactionsReturn => { // Видаляємо onDataRefreshed, бо він більше не потрібен з цим підходом
  const { token, user, isAuthenticated } = useAuth();
  const userId = user?.id;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [dataVersion, setDataVersion] = useState(0); // <-- НОВЕ: Стан для версії даних

  const [queryParams, setQueryParams] = useState<TransactionQueryParams>({
    page: 1,
    limit: 10, // Можете збільшити ліміт, якщо список RecentTransactions має бути довшим
    sortBy: 'transactionDate',
    sortOrder: 'DESC',
  });

  const fetchData = useCallback(
    async (paramsToFetch: TransactionQueryParams) => {
      if (!isAuthenticated || !token || !userId) {
        setTransactions([]);
        setSummary(null);
        setTotalPages(1);
        setCurrentPage(1);
        setTotalCount(0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setOperationError(null);
      try {
        const [paginated, fetchedSummary]: [
          PaginatedTransactionsResponse,
          FinancialSummary,
        ] = await Promise.all([
          getUserTransactions(token, userId, paramsToFetch),
          getFinancialSummary(token, userId),
        ]);

        setTransactions([...paginated.transactions]);
        setSummary(fetchedSummary);
        setCurrentPage(paginated.currentPage);
        setTotalPages(paginated.totalPages);
        setTotalCount(paginated.totalCount);
        setDataVersion((v) => v + 1); // <-- НОВЕ: Оновлюємо версію даних
      } catch (err: any) {
        setOperationError(err.message || 'Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    },
    [token, userId, isAuthenticated], // dataVersion не потрібен тут як залежність для fetchData
  );

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchData(queryParams);
    }
    // Цей useEffect спрацює при зміні queryParams або при вході користувача.
    // dataVersion тут не потрібен, бо fetchData сам його оновлює.
  }, [isAuthenticated, userId, queryParams, fetchData]);


  const addTransaction: AddTransactionFn = async (
    amount,
    type,
    category,
    description,
    transactionDate,
  ) => {
    if (!isAuthenticated || !token || !userId)
      throw new Error('Not authenticated');

    setOperationError(null);
    // setIsLoading(true); // fetchData зробить це

    try {
      await apiCreateTransaction(
        token,
        userId,
        amount,
        type,
        category,
        description,
        transactionDate,
      );
      // fetchData оновить дані та dataVersion, що спричинить оновлення залежних компонентів.
      await fetchData({ ...queryParams, page: 1 }); // Після додавання, зазвичай, показуємо першу сторінку
    } catch (err: any) {
      setOperationError(err.message || 'Failed to add transaction');
      // setIsLoading(false); // fetchData зробить це у finally
      throw err;
    }
  };

  const deleteTransaction = async (transactionId: string): Promise<void> => {
    if (!isAuthenticated || !token) throw new Error('Not authenticated');
    setOperationError(null);
    // setIsLoading(true); // fetchData зробить це

    try {
      await apiDeleteTransaction(token, transactionId);
      // fetchData оновить дані та dataVersion
      await fetchData(queryParams); // Залишаємось на поточній сторінці або оновлюємо її
    } catch (err: any) {
      setOperationError(err.message || 'Failed to delete transaction');
      // setIsLoading(false); // fetchData зробить це у finally
      throw err;
    }
  };

  const handleSetQueryParams = (p: Partial<TransactionQueryParams>) =>
    setQueryParams((prev) => {
      const updated = { ...prev, ...p };
      // Якщо змінюється будь-який фільтр, крім сторінки, скидаємо на першу сторінку
      if (p.page === undefined && (p.type !== undefined || p.category !== undefined || p.sortBy !== undefined || p.sortOrder !== undefined || p.limit !== undefined)) {
        updated.page = 1;
      }
      return updated;
    });

  return {
    transactions,
    summary,
    loading: isLoading,
    error: operationError,
    addTransaction,
    deleteTransaction,
    refreshTransactions: () => fetchData(queryParams),
    queryParams,
    setQueryParams: handleSetQueryParams,
    currentPage,
    totalPages,
    totalCount,
    dataVersion, // <-- НОВЕ: Експортуємо dataVersion
  };
};