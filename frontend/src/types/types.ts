// src/types/types.ts
export interface User {
  id: string;
  email: string;
  name?: string;
}

export type TransactionSortBy = 'transactionDate' | 'amount' | 'category' | 'type'; // Можливі поля для сортування
export type SortOrder = 'ASC' | 'DESC';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  transactionDate: string; // ISO string
  createdAt: string;       // ISO string
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  userId?: string;
}

export interface Goal {
  id: string;
  userId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  status: 'in_progress' | 'completed' | 'failed';
  createdAt: string;
}

export interface LoginApiResponse {
  token: string;
  user: User;
}

export interface RegisterApiResponse {
  user?: User;
  message?: string;
}

// Параметри для запиту списку транзакцій (фільтрація, сортування, пагінація)
export interface TransactionQueryParams {
  page?: number;
  limit?: number;
  type?: 'income' | 'expense';
  category?: string;
  sortBy?: TransactionSortBy;
  sortOrder?: SortOrder;
}