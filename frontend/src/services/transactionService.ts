// frontend/src/services/transactionService.ts
import { authRequest } from './api'; // Припускаємо, що authRequest або базовий 'api' вже додає "/api"
import { 
  Transaction, 
  FinancialSummary, 
  TransactionQueryParams,
  // PaginatedTransactionsResponse, // Тепер буде експортуватися звідси
  MonthlySummary,
  CategoryExpense
} from '../types/types';

// Тип для відповіді з пагінацією
export interface PaginatedTransactionsResponse { // Експортуємо, щоб виправити помилку TypeScript
  transactions: Transaction[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

// ОНОВЛЕНО: Прибираємо /api, оскільки він, ймовірно, додається в api.ts або authRequest
const SERVICE_BASE_URL = '/transactions'; 

export const createTransaction = async (
  token: string,
  currentUserId: string,
  amount: number,
  type: 'income' | 'expense',
  category: string,
  description: string,
  date: string
): Promise<Transaction> => {
  return authRequest(`${SERVICE_BASE_URL}`, token, { // Використовуємо SERVICE_BASE_URL
    method: 'POST',
    body: JSON.stringify({
      userId: currentUserId,
      amount,
      type,
      category,
      description,
      transactionDate: date,
    }),
  });
};

export const getUserTransactions = async (
  token: string,
  userId: string,
  params?: TransactionQueryParams
): Promise<PaginatedTransactionsResponse> => {
  let endpoint = `${SERVICE_BASE_URL}/user/${userId}`; // Використовуємо SERVICE_BASE_URL
  if (params) {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params.type) queryParams.append('type', params.type);
    if (params.category) queryParams.append('category', params.category);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const queryString = queryParams.toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }
  }
  console.log('Frontend Service: getUserTransactions calling endpoint (after /api):', endpoint);
  return authRequest(endpoint, token); // authRequest додасть /api, якщо потрібно
};

export const getFinancialSummary = async (
  token: string,
  userId: string
): Promise<FinancialSummary> => {
  const endpoint = `${SERVICE_BASE_URL}/summary/overall/${userId}`; // Використовуємо SERVICE_BASE_URL
  console.log('Frontend Service: getFinancialSummary calling endpoint (after /api):', endpoint);
  return authRequest(endpoint, token);
};

export const getMonthlySummaryData = async (
  token: string,
  userId: string,
): Promise<MonthlySummary> => {
  const endpoint = `${SERVICE_BASE_URL}/summary/monthly/${userId}`; // Використовуємо SERVICE_BASE_URL
  console.log('Frontend Service: getMonthlySummaryData calling endpoint (after /api):', endpoint);
  return authRequest(endpoint, token);
};

export const getCategoryExpensesData = async (
  token: string,
  userId: string,
): Promise<CategoryExpense[]> => {
  const endpoint = `${SERVICE_BASE_URL}/expenses/by-category/${userId}`; // Використовуємо SERVICE_BASE_URL
  console.log('Frontend Service: getCategoryExpensesData calling endpoint (after /api):', endpoint);
  return authRequest(endpoint, token);
};

export const deleteTransaction = async (
  token: string,
  transactionId: string
): Promise<void> => {
  const endpoint = `${SERVICE_BASE_URL}/${transactionId}`; // Використовуємо SERVICE_BASE_URL
  console.log('Frontend Service: deleteTransaction calling endpoint (after /api):', endpoint);
  await authRequest(endpoint, token, {
    method: 'DELETE',
  });
};