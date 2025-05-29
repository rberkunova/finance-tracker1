// frontend/src/components/Dashboard/FinancialGoals.tsx
import React, { useState } from 'react';
import { Goal } from '../../types/types'; // Переконайтесь, що шлях правильний
import { useGoals } from '../../hooks/useGoals'; // Переконайтесь, що шлях правильний

interface FinancialGoalsProps {
  dataVersion: number; // <-- НОВЕ: Проп для тригера оновлення
}

const FinancialGoals: React.FC<FinancialGoalsProps> = ({ dataVersion }) => {
  // Передаємо dataVersion до хука useGoals
  const { goals, addGoal, loading, error, refreshGoals } = useGoals(dataVersion);

  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const target = parseFloat(targetAmount);
    if (!goalName.trim() || isNaN(target) || target <= 0 || !deadline) {
      setFormError('Please fill in all required fields correctly.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addGoal(goalName.trim(), target, deadline);
      // Очищення форми
      setGoalName('');
      setTargetAmount('');
      setDeadline(new Date().toISOString().split('T')[0]);
      // Список цілей оновиться автоматично завдяки dataVersion або виклику fetchGoals в addGoal хука
    } catch (err: any) {
      setFormError(err.message || 'Failed to add goal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toMoney = (value: number | string | null | undefined) => {
    const n = Number(value);
    return isFinite(n) ? n.toFixed(2) : '0.00';
  };

  const getProgressPercent = (g: Goal) => {
    const current = Number(g.currentAmount); // currentAmount тепер динамічний з бекенду
    const target = Number(g.targetAmount);
    if (!isFinite(target) || target <= 0 || !isFinite(current) || current < 0) return 0; // Додано перевірки
    return Math.min(Math.max((current / target) * 100, 0), 100); // Гарантуємо 0-100
  };

  const getProgressColor = (g: Goal) => {
    const p = getProgressPercent(g);
    if (p >= 100) return 'bg-green-500';
    if (p >= 75) return 'bg-sky-500'; // Змінено на sky для кращого контрасту
    if (p >= 50) return 'bg-yellow-400';
    if (p >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-700">
        My Financial Goals
      </h3>

      <form
        onSubmit={handleSubmit}
        className="mb-8 p-4 border rounded-lg bg-gray-50 space-y-4"
      >
        <h4 className="text-lg font-medium text-gray-800">Add New Goal</h4>
        {formError && (
          <div className="p-2 bg-red-100 text-red-700 rounded text-sm">
            {formError}
          </div>
        )}
        {/* ... решта форми ... (залишається без змін) ... */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="goalName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Goal Name
            </label>
            <input
              id="goalName" type="text" value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md" required disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Target Amount ($)
            </label>
            <input
              id="targetAmount" type="number" value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              step="0.01" min="0.01" required disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
              Deadline
            </label>
            <input
              id="deadline" type="date" value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 border rounded-md" required disabled={isSubmitting}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting || loading} // Використовуємо loading з useGoals
          className="w-full bg-indigo-600 text-white py-2.5 rounded-md disabled:opacity-60"
        >
          {isSubmitting ? 'Adding...' : 'Add Goal'}
        </button>
      </form>

      {loading && <p className="text-gray-500 text-center py-4">Loading goals…</p>}
      {error && !loading && (
        <p className="text-red-500 bg-red-50 p-3 rounded text-center">
          {error}{' '}
          <button
            onClick={refreshGoals} // refreshGoals з useGoals
            className="ml-2 text-sm text-blue-500 underline"
          >
            Retry
          </button>
        </p>
      )}

      {!loading && !error && goals.length === 0 && (
        <p className="text-gray-500 text-center py-4">
          You haven&apos;t set any financial goals yet.
        </p>
      )}

      {!loading && !error && goals.length > 0 && (
        <div className="space-y-4">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-800">{goal.goalName}</h4>
                <span
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                    goal.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : goal.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {goal.status.replace('_', ' ')}
                </span>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>
                    ${toMoney(goal.currentAmount)} of $
                    {toMoney(goal.targetAmount)}
                  </span>
                  {goal.deadline && (
                    <span>
                      Deadline:{' '}
                      {new Date(goal.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full ${getProgressColor(goal)}`}
                    style={{ width: `${getProgressPercent(goal)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FinancialGoals;