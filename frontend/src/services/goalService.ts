// frontend/src/services/goalService.ts
import { authRequest } from './api';
import { Goal } from '../types/types';

/** POST /api/goals */
export const createGoal = async (
  token: string,
  goalName: string,
  targetAmount: number,
  deadline: string,
  userId: string,
): Promise<Goal> => {
  return authRequest('/goals', token, {
    method: 'POST',
    body: JSON.stringify({
      userId,
      goalName,
      targetAmount,
      deadline,
    }),
  });
};

/** GET /api/goals/user/:userId */
export const getUserGoals = async (
  token: string,
  userId: string,
): Promise<Goal[]> => authRequest(`/goals/user/${userId}`, token);

/** PUT /api/goals/:goalId */
export const updateGoal = async (
  token: string,
  goalId: string,
  updates: Partial<Omit<Goal, 'id' | 'userId' | 'createdAt'>>,
): Promise<Goal> =>
  authRequest(`/goals/${goalId}`, token, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });

/** DELETE /api/goals/:goalId (якщо знадобиться) */
export const deleteGoal = async (
  token: string,
  goalId: string,
): Promise<void> => {
  await authRequest(`/goals/${goalId}`, token, { method: 'DELETE' });
};
