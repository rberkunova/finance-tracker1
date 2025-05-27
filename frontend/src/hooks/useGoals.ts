// frontend/src/hooks/useGoals.ts
import { useState, useEffect, useCallback } from 'react';
import { Goal } from '../types/types';
import { useAuth } from '../context/AuthContext';
import {
  createGoal as apiCreateGoal,
  getUserGoals as apiGetUserGoals,
  updateGoal as apiUpdateGoal,
} from '../services/goalService';

export const useGoals = () => {
  const { token, user, isAuthenticated } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!isAuthenticated || !token || !user?.id) {
      setGoals([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiGetUserGoals(token, user.id);
      setGoals(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, user]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const addGoal = async (
    name: string,
    target: number,
    deadline: string,
  ) => {
    if (!token || !user?.id) throw new Error('No auth');
    setLoading(true);
    try {
      const newGoal = await apiCreateGoal(
        token,
        name,
        target,
        deadline,
        user.id,
      );
      setGoals((g) => [...g, newGoal]);
    } finally {
      setLoading(false);
    }
  };

  const updateGoal = async (
    id: string,
    updates: Partial<Omit<Goal, 'id' | 'userId' | 'createdAt'>>,
  ) => {
    if (!token) throw new Error('No auth');
    setLoading(true);
    try {
      const upd = await apiUpdateGoal(token, id, updates);
      setGoals((g) => g.map((gl) => (gl.id === id ? upd : gl)));
    } finally {
      setLoading(false);
    }
  };

  return { goals, loading, error, addGoal, updateGoal, refreshGoals: fetchGoals };
};
