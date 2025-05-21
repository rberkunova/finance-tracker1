// src/services/transactionService.ts
import { authRequest } from './api';
import { Transaction, FinancialSummary } from '../types/types'; // Імпортуємо оновлені типи

export const createTransaction = async (
  token: string,
  currentUserId: string, // Це userId з AuthContext
  amount: number,
  type: 'income' | 'expense',
  category: string,
  description: string,
  date: string // Це transaction_date у форматі YYYY-MM-DD
): Promise<Transaction> => {
  // Тіло запиту повинно відповідати тому, що очікує бекенд
  // і що відповідає типу Transaction (з полями user_id, transaction_date)
  return authRequest('/transactions', token, {
    method: 'POST',
    body: JSON.stringify({
      // Якщо бекенд Transaction DTO очікує userId, amount, type, category, description, transactionDate (camelCase)
      // тоді тут не треба user_id, а треба userId.
      // Але оскільки помилка вказувала на user_id в типі Transaction, припускаємо, що бекенд чекає snake_case
      user_id: currentUserId, // Надсилаємо як user_id
      amount,
      type,
      category,
      description,
      transaction_date: date, // Надсилаємо як transaction_date
    }),
  });
};

export const getUserTransactions = async (
  token: string,
  userId: string // API endpoint /transactions/:userId (тут userId зазвичай camelCase або як параметр шляху)
): Promise<Transaction[]> => {
  // Відповідь від цього API має повертати масив об'єктів Transaction
  // з полями user_id, transaction_date, created_at
  return authRequest(`/transactions/${userId}`, token);
};

export const getFinancialSummary = async (
  token: string,
  userId: string // API endpoint /transactions/:userId/summary
): Promise<FinancialSummary> => {
  // Відповідь від цього API має повертати FinancialSummary
  // з полями totalIncome, totalExpense, balance
  return authRequest(`/transactions/${userId}/summary`, token);
};