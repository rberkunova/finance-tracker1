// src/types/types.ts
export interface User {
  id: string;
  email: string;
  name?: string;
}

export type TransactionSortBy = 'transactionDate' | 'amount' | 'category' | 'type';
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

// Загальний фінансовий звіт (вже існує)
export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  userId?: string; // Це поле може бути зайвим, якщо userId завжди відомий з контексту
}

// НОВИЙ ТИП: Місячний фінансовий звіт
export interface MonthlySummary {
  monthIncome: number;
  monthExpense: number;
}

// НОВИЙ ТИП: Витрати за категорією
export interface CategoryExpense {
  category: string;
  totalAmount: number;
}

export interface Goal {
  id: string;
  userId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO string
  status: 'in_progress' | 'completed' | 'failed';
  createdAt: string; // ISO string
}

export interface LoginApiResponse {
  token: string;
  user: User;
}

export interface RegisterApiResponse {
  user?: User; // Може повернути користувача або тільки повідомлення
  message?: string;
}

export interface TransactionQueryParams {
  page?: number;
  limit?: number;
  type?: 'income' | 'expense';
  category?: string;
  sortBy?: TransactionSortBy;
  sortOrder?: SortOrder;
}

// Тип для відповіді з пагінацією (вже існує у вашому transactionService.ts, можна винести сюди для централізації)
export interface PaginatedTransactionsResponse {
  transactions: Transaction[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}