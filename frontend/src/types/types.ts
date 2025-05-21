// src/types/types.ts
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Transaction {
  id: string; // Зазвичай UUID, залишаємо camelCase
  user_id: string; // Змінено на snake_case згідно з помилкою
  amount: number;    // camelCase
  type: 'income' | 'expense'; // camelCase
  category: string;  // camelCase
  description: string; // camelCase
  transaction_date: string; // Змінено на snake_case згідно з помилкою (очікується ISO рядок)
  created_at: string;     // Змінено на snake_case згідно з помилкою (очікується ISO рядок)
}

export interface FinancialSummary {
  totalIncome: number;  // Змінено на camelCase згідно з помилкою
  totalExpense: number; // Змінено на camelCase згідно з помилкою
  balance: number;      // camelCase
  userId?: string;       // camelCase, опціонально
}

export interface Goal {
  id: string;
  user_id: string; // Змінено на snake_case для узгодженості, якщо це так у вашій БД/API
  goalName: string; // camelCase (або goal_name якщо так з бекенду)
  targetAmount: number;
  currentAmount: number;
  deadline: string; 
  status: 'in_progress' | 'completed' | 'failed';
  created_at: string; // Змінено на snake_case
}

export interface LoginApiResponse {
  token: string;
  user: User;
}

export interface RegisterApiResponse {
  user?: User; 
  message?: string;
}