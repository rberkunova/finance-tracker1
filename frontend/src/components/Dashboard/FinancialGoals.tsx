import { useState } from 'react';
import { Goal } from '../../types/types';
import { useGoals } from '../../hooks/useGoals';

const FinancialGoals = ({ goals }: { goals: Goal[] }) => {
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const { addGoal } = useGoals();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addGoal(goalName, parseFloat(targetAmount), deadline);
    // Reset form
    setGoalName('');
    setTargetAmount('');
    setDeadline('');
  };

  const getProgressColor = (goal: Goal) => {
    const progress = (goal.current_amount / goal.target_amount) * 100;
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-medium mb-4">Financial Goals</h3>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="goalName" className="block text-sm font-medium text-gray-700 mb-1">
              Goal Name
            </label>
            <input
              type="text"
              id="goalName"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Target Amount
            </label>
            <input
              type="number"
              id="targetAmount"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
              Deadline
            </label>
            <input
              type="date"
              id="deadline"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Add Goal
        </button>
      </form>

      {goals.length === 0 ? (
        <p className="text-gray-500">No goals yet</p>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">{goal.goal_name}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  goal.status === 'completed' ? 'bg-green-100 text-green-800' :
                  goal.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {goal.status.replace('_', ' ')}
                </span>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>${goal.current_amount.toFixed(2)} of ${goal.target_amount.toFixed(2)}</span>
                  <span>{new Date(goal.deadline).toLocaleDateString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${getProgressColor(goal)}`}
                    style={{
                      width: `${Math.min(
                        (goal.current_amount / goal.target_amount) * 100,
                        100
                      )}%`,
                    }}
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