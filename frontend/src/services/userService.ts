// src/services/userService.ts
import { apiRequest } from './api';

// Припустимо, що у вас є або буде такий тип User
interface User {
  id: string;
  email: string;
  name?: string;
}

export interface LoginResponse { // Оновлена відповідь від API
  token: string;
  user: User;
}

export interface RegisterResponse { // Відповідь від API реєстрації (не змінюємо)
  // Залежно від вашого API, може повертати користувача або просто успішний статус
  user?: User; // Наприклад
  message?: string;
}

export const registerUser = (
  name: string,
  email: string,
  password: string,
): Promise<RegisterResponse> => { // Тип відповіді може бути більш конкретним
  return apiRequest('/users/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
};

export const loginUser = (
  email: string,
  password: string,
): Promise<LoginResponse> => { // Оновлений тип відповіді
  return apiRequest('/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};