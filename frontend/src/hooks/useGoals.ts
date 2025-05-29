// frontend/src/hooks/useGoals.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Goal } from '../types/types';
import { useAuth } from '../context/AuthContext';
import {
  createGoal as apiCreateGoal,
  getUserGoals as apiGetUserGoals,
  updateGoal as apiUpdateGoal,
} from '../services/goalService';

export interface UseGoalsReturn {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  addGoal: (name: string, target: number, deadline: string) => Promise<Goal | undefined>;
  updateGoal: (
    id: string,
    updates: Partial<Omit<Goal, 'id' | 'userId' | 'createdAt' | 'currentAmount' | 'status'>>,
  ) => Promise<Goal | undefined>;
  refreshGoals: () => Promise<void>;
}

export const useGoals = (dataVersion?: number): UseGoalsReturn => {
  const { token, user, isAuthenticated } = useAuth(); // Тепер стабільніші

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true); // Починаємо з true
  const [error, setError] = useState<string | null>(null);
  const prevDataVersionRef = useRef(dataVersion);

  const fetchGoals = useCallback(async (context = "generic") => {
    console.log(`useGoals (${context}): fetchGoals called. Auth: (isAuth: ${isAuthenticated}, userId: ${user?.id}, token: ${token ? 'yes' : 'no'})`);
    if (!isAuthenticated || !token || !user?.id) {
      setGoals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiGetUserGoals(token, user.id);
      setGoals(data);
      console.log(`useGoals (${context}): fetchGoals success, ${data.length} goals loaded.`);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch goals');
      console.error(`useGoals (${context}): Error fetching goals:`, e);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, user]); // user тут може бути об'єктом, його стабільність залежить від useAuth

  // Початкове завантаження та реакція на зміну аутентифікації/користувача
  useEffect(() => {
    if (isAuthenticated && user?.id) { // Тільки якщо користувач повністю автентифікований
        console.log("useGoals: Initial load or auth change detected.");
        fetchGoals("initial/authChange");
    } else {
        // Очищаємо цілі, якщо користувач не автентифікований
        setGoals([]);
        setLoading(false);
        console.log("useGoals: Not authenticated, clearing goals.");
    }
  }, [isAuthenticated, user?.id, fetchGoals]); // Залежність від user.id замість всього об'єкта user для більшої стабільності, якщо user має інші поля, що змінюються

  // Реакція на зміну dataVersion (з зовнішнього джерела, наприклад, після додавання транзакції)
  useEffect(() => {
    if (dataVersion !== undefined && dataVersion !== prevDataVersionRef.current) {
      console.log(`useGoals: dataVersion prop changed from ${prevDataVersionRef.current} to ${dataVersion}. Triggering refresh.`);
      fetchGoals("dataVersionChange");
    }
    prevDataVersionRef.current = dataVersion;
  }, [dataVersion, fetchGoals]);


  const addGoal = async (name: string, target: number, deadline: string): Promise<Goal | undefined> => {
    if (!token || !user?.id) throw new Error('Not authenticated');
    setLoading(true); setError(null);
    try {
      const newGoalData = await apiCreateGoal(token, name, Number(target), deadline, user.id);
      // Після успішного додавання, перезавантажуємо список цілей,
      // щоб отримати актуальний currentAmount, розрахований на бекенді.
      await fetchGoals("addGoal");
      return newGoalData; // Повертаємо дані, отримані від API (можуть бути без розрахунку балансу)
    } catch(e: any) { 
      setError(e.message || 'Failed to add goal'); 
      throw e; 
    } finally {
      setLoading(false);
    }
  };

  const updateGoal = async (id: string, updates: Partial<Omit<Goal, 'id' | 'userId' | 'createdAt' | 'currentAmount' | 'status'>>): Promise<Goal | undefined> => {
    if (!token || !user?.id) throw new Error('Not authenticated');
    setLoading(true); setError(null);
    try {
      const updatedGoalData = await apiUpdateGoal(token, id, updates);
      await fetchGoals("updateGoal"); // Перезавантажуємо для консистентності
      return updatedGoalData;
    } catch(e: any) { 
      setError(e.message || 'Failed to update goal'); 
      throw e; 
    } finally {
      setLoading(false);
    }
  };

  return { goals, loading, error, addGoal, updateGoal, refreshGoals: () => fetchGoals("manualRefresh") };
};