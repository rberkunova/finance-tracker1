// src/hooks/useTransactions.ts
import { useState, useEffect, useCallback } from 'react';
import { Transaction, FinancialSummary, TransactionQueryParams } from '../types/types';
import { useAuth } from '../context/AuthContext';
import {
  createTransaction as apiCreateTransaction,
  getUserTransactions,
  getFinancialSummary,
  deleteTransaction as apiDeleteTransaction,
  PaginatedTransactionsResponse,
} from '../services/transactionService';

export const useTransactions = () => {
  const { token, user, isAuthenticated } = useAuth();
  const userId = user?.id;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const initialQueryParams: TransactionQueryParams = {
    page: 1,
    limit: 10,
    sortBy: 'transactionDate',
    sortOrder: 'DESC',
  };
  const [queryParams, setQueryParams] = useState<TransactionQueryParams>(initialQueryParams);

  const fetchData = useCallback(async (paramsToFetch: TransactionQueryParams) => {
    if (!isAuthenticated || !token || !userId) {
      setTransactions([]); 
      setSummary(null); 
      setTotalPages(1); 
      setCurrentPage(1); 
      setTotalCount(0);
      setIsLoading(false);
      return;
    }

    console.log("useTransactions: Fetching data with params:", paramsToFetch);
    setIsLoading(true);
    setOperationError(null); // Clear previous operation errors before a new fetch
    try {
      const [paginatedResponse, fetchedSummary] = await Promise.all([
        getUserTransactions(token, userId, paramsToFetch),
        getFinancialSummary(token, userId), 
      ]);
      
      console.log("useTransactions: API response for transactions:", paginatedResponse.transactions);
      // Ensure a new array reference is always set
      setTransactions(paginatedResponse.transactions ? [...paginatedResponse.transactions] : []); 
      setSummary(fetchedSummary);
      setCurrentPage(paginatedResponse.currentPage);
      setTotalPages(paginatedResponse.totalPages);
      setTotalCount(paginatedResponse.totalCount);
      console.log("useTransactions: State updated after fetch. Transactions count:", paginatedResponse.transactions?.length);

    } catch (err: any) {
      console.error("useTransactions: Failed to fetch data:", err);
      setOperationError(err.message || 'Failed to load transaction data.');
      // Optionally, don't clear transactions on fetch error to keep showing stale data with an error message
    } finally {
      setIsLoading(false);
    }
  }, [token, userId, isAuthenticated]); // Removed fetchData from its own dependency array

  useEffect(() => {
    if (isAuthenticated && userId) {
      console.log("useTransactions: useEffect triggered due to auth/queryParams change. Fetching data.");
      fetchData(queryParams);
    } else {
      console.log("useTransactions: useEffect triggered. User not authenticated or no userId. Clearing data.");
      setTransactions([]); 
      setSummary(null); 
      setIsLoading(false);
      setTotalPages(1); 
      setCurrentPage(1); 
      setTotalCount(0);
    }
  }, [isAuthenticated, userId, queryParams, fetchData]);

// src/hooks/useTransactions.ts
// ... (початок файлу)

// ... (fetchData та useEffect залишаються такими ж) ...

  const addTransaction = async (
    amount: number,
    type: 'income' | 'expense',
    category: string,
    description: string,
    transactionDate: string
  ): Promise<void> => {
    if (!isAuthenticated || !token || !userId) {
      const authError = 'Action requires authentication.';
      setOperationError(authError);
      throw new Error(authError);
    }
    if (!transactionDate || !new Date(transactionDate).toISOString().startsWith(transactionDate.substring(0,10)) ) {
        const dateError = 'Invalid transaction date provided. Expected YYYY-MM-DD.';
        setOperationError(dateError);
        throw new Error(dateError);
    }

    setIsLoading(true);
    setOperationError(null);
    try {
      console.log("useTransactions: Adding transaction (calling API)...");
      const newTransactionFromServer = await apiCreateTransaction(token, userId, amount, type, category, description, transactionDate);
      console.log("useTransactions: Transaction created on backend:", newTransactionFromServer);

      // Після успішного створення, МИ ПРИМУСОВО ОНОВИМО СТАН `transactions`
      // ДОДАВШИ НОВУ ТРАНЗАКЦІЮ НА ПОЧАТОК (ЯКЩО СОРТУВАННЯ ЗА ДАТОЮ СПАДАННЯ)
      // А ПОТІМ ВИКЛИЧЕМО ПЕРЕЗАПИТ ДЛЯ СИНХРОНІЗАЦІЇ SUMMARY ТА ПАГІНАЦІЇ
      
      // 1. Оптимістично (або з реальною відповіддю сервера) оновлюємо список
      setTransactions(prevTransactions => {
        let updatedTransactions = [newTransactionFromServer, ...prevTransactions];
        // Якщо поточні queryParams вказують на першу сторінку, обрізаємо до ліміту
        if (queryParams.page === 1 && queryParams.limit && updatedTransactions.length > queryParams.limit) {
          updatedTransactions = updatedTransactions.slice(0, queryParams.limit);
        }
        console.log("useTransactions: Optimistically/Immediately updating transactions state with new item.");
        return [...updatedTransactions]; // Ще раз гарантуємо нове посилання
      });
      
      setTotalCount(prev => prev + 1); // Оптимістично збільшуємо

      // 2. Перезапитуємо summary та пагінацію (і, можливо, скоригуємо список, якщо сортування/фільтри інші)
      // Якщо нова транзакція завжди має бути на першій сторінці
      const paramsForFullRefresh = { ...queryParams, page: 1 };
      console.log("useTransactions: Initiating full refresh after add with params:", paramsForFullRefresh);
      
      // Якщо queryParams вже були для першої сторінки, fetchData може не викликати оновлення, якщо посилання на queryParams не змінилося
      // Тому можемо викликати fetchData напряму, або гарантувати зміну queryParams
      if (queryParams.page !== 1 || JSON.stringify(queryParams) !== JSON.stringify(paramsForFullRefresh) ) {
          setQueryParams(paramsForFullRefresh); // Це викличе useEffect -> fetchData
      } else {
          await fetchData(paramsForFullRefresh); // Якщо параметри не змінилися, викликаємо fetchData напряму
      }
      
    } catch (err: any) {
      console.error("useTransactions: Failed to add transaction:", err);
      const errorMessage = err.message || 'Failed to add transaction. Please try again.';
      setOperationError(errorMessage);
      // Тут можна відкотити оптимістичне оновлення, якщо воно було більш складним
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false); 
    }
  };

// ... (решта коду: deleteTransaction, handleSetQueryParams, return ...)
// deleteTransaction також має використовувати fetchData або setQueryParams для оновлення
// Функція deleteTransaction з попередньої відповіді вже робить це правильно.
// ... (решта коду useTransactions.ts з попередньої відповіді)
  const deleteTransaction = async (transactionId: string): Promise<void> => {
    if (!isAuthenticated || !token) {
      const authError = 'Action requires authentication.';
      setOperationError(authError);
      throw new Error(authError);
    }
    
    const previousTransactions = [...transactions]; // Для відкату

    // Оптимістичне видалення з UI
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    setTotalCount(prev => Math.max(0, prev - 1));
    // Оптимістичне оновлення summary (якщо потрібно)
    const transactionToDelete = previousTransactions.find(t => t.id === transactionId);
    if (transactionToDelete) {
        setSummary(prevSummary => {
            if (!prevSummary) return null;
            const amountToAdjust = Number(transactionToDelete.amount);
            const newTotalIncome = prevSummary.totalIncome - (transactionToDelete.type === 'income' ? amountToAdjust : 0);
            const newTotalExpense = prevSummary.totalExpense - (transactionToDelete.type === 'expense' ? amountToAdjust : 0);
            return {
                ...prevSummary,
                totalIncome: newTotalIncome,
                totalExpense: newTotalExpense,
                balance: newTotalIncome - newTotalExpense,
            };
        });
    }
    console.log("useTransactions: Optimistically deleted transaction from UI.");


    setIsLoading(true);
    setOperationError(null);
    try {
      console.log(`useTransactions: Deleting transaction ${transactionId} on backend...`);
      await apiDeleteTransaction(token, transactionId);
      console.log(`useTransactions: Transaction ${transactionId} deleted on backend.`);
      
      let newPage = queryParams.page || 1;
      if (previousTransactions.filter(t => t.id !== transactionId).length === 0 && newPage > 1) {
        newPage = Math.max(1, newPage - 1);
      }
      
      const paramsForRefresh = { ...queryParams, page: newPage };
      console.log("useTransactions: Refreshing all data after delete with params:", paramsForRefresh);

      if (JSON.stringify(queryParams) === JSON.stringify(paramsForRefresh)) {
          await fetchData(paramsForRefresh);
      } else {
          setQueryParams(paramsForRefresh);
      }

    } catch (err: any) {
      console.error("useTransactions: Failed to delete transaction on backend:", err);
      const errorMessage = err.message || 'Failed to delete transaction. Please try again.';
      setOperationError(errorMessage);
      // Відкат оптимістичного оновлення
      setTransactions(previousTransactions);
      // Повторний запит summary та пагінації, якщо оптимістичне оновлення було для них теж
      fetchData(queryParams); 
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSetQueryParams = useCallback((newParams: Partial<TransactionQueryParams>) => {
    setQueryParams(prevParams => {
      const updatedParams = { ...prevParams, ...newParams };
      if (newParams.page === undefined && (
          newParams.type !== undefined || 
          newParams.category !== undefined || 
          newParams.sortBy !== undefined || 
          newParams.sortOrder !== undefined ||
          newParams.limit !== undefined
        )) {
        updatedParams.page = 1;
      }
      return updatedParams;
    });
  }, []);


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
  };
};
