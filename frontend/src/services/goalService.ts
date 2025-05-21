import { authRequest } from './api';
import { Goal } from '../types/types';

export const createGoal = async (
  token: string,
  goal_name: string,
  target_amount: number,
  deadline: string
): Promise<Goal> => {
  return authRequest('/goals', token, {
    method: 'POST',
    body: JSON.stringify({ goal_name, target_amount, deadline }),
  });
};

export const getUserGoals = async (token: string, userId: string): Promise<Goal[]> => {
  return authRequest(`/goals/${userId}`, token);
};

export const updateGoal = async (
  token: string,
  goalId: string,
  updates: Partial<Goal>
): Promise<Goal> => {
  return authRequest(`/goals/${goalId}`, token, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};