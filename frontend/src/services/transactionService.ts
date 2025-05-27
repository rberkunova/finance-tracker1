// frontend/src/services/transactionService.ts
import { authRequest } from './api';
import { Transaction, FinancialSummary, TransactionQueryParams } from '../types/types';

// Тип для відповіді з пагінацією, який повертає бекенд
export interface PaginatedTransactionsResponse {
  transactions: Transaction[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export const createTransaction = async (
  token: string,
  currentUserId: string,
  amount: number,
  type: 'income' | 'expense',
  category: string,
  description: string,
  date: string // Очікується 'YYYY-MM-DD'
): Promise<Transaction> => {
  return authRequest('/transactions', token, {
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
  let endpoint = `/transactions/${userId}`;
  if (params) {
    const queryParams = new URLSearchParams();
    // Додаємо тільки існуючі параметри
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
  return authRequest(endpoint, token);
};

export const getFinancialSummary = async (
  token: string,
  userId: string
): Promise<FinancialSummary> => {
  return authRequest(`/transactions/${userId}/summary`, token);
};

export const deleteTransaction = async (
  token: string,
  transactionId: string
): Promise<void> => { // Відповідь 204 No Content не має тіла
  await authRequest(`/transactions/${transactionId}`, token, {
    method: 'DELETE',
  });
  // Повертаємо void, оскільки authRequest для 204 поверне null
};
