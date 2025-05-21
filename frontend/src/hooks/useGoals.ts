import { useState, useEffect } from 'react';
import { Goal } from '../types/types';
import { useAuth } from '../context/AuthContext';
import { createGoal as createGoalApi, getUserGoals as getUserGoalsApi, updateGoal as updateGoalApi } from '../services/goalService';

export const useGoals = () => {
  const { token, user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = async () => {
    if (!token || !user) return;
    
    try {
      setLoading(true);
      const goalsData = await getUserGoalsApi(token, user.id);
      setGoals(goalsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async (goal_name: string, target_amount: number, deadline: string) => {
    if (!token) return;
    
    try {
      setLoading(true);
      const newGoal = await createGoalApi(token, goal_name, target_amount, deadline);
      setGoals(prev => [...prev, newGoal]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add goal');
    } finally {
      setLoading(false);
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!token) return;
    
    try {
      setLoading(true);
      const updatedGoal = await updateGoalApi(token, goalId, updates);
      setGoals(prev => prev.map(goal => goal.id === goalId ? updatedGoal : goal));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update goal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [token, user]);

  return {
    goals,
    loading,
    error,
    addGoal,
    updateGoal,
    refreshGoals: fetchGoals,
  };
};