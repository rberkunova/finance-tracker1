// frontend/src/components/Dashboard/EditGoalModal.tsx
import React, { useState, useEffect } from 'react';
import { Goal } from '../../types/types';

interface EditGoalModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Omit<Goal, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
}

const EditGoalModal: React.FC<EditGoalModalProps> = ({ goal, isOpen, onClose, onSave }) => {
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (goal) {
      setGoalName(goal.goalName);
      setTargetAmount(String(goal.targetAmount));
      setDeadline(new Date(goal.deadline).toISOString().split('T')[0]);
    }
  }, [goal]);

  if (!isOpen || !goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const target = parseFloat(targetAmount);
    if (!goalName.trim() || isNaN(target) || target <= 0) {
        setError('Please fill in all fields correctly.');
        return;
    }
    
    setIsSaving(true);
    try {
        await onSave(goal.id, { goalName: goalName.trim(), targetAmount: target, deadline });
        onClose();
    } catch (err: any) {
        setError(err.message || 'Failed to save changes.');
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Goal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 bg-red-50 p-2 rounded">{error}</p>}
          <div>
            <label htmlFor="editGoalName" className="block text-sm font-medium text-gray-700">Goal Name</label>
            <input id="editGoalName" type="text" value={goalName} onChange={e => setGoalName(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" required />
          </div>
          <div>
            <label htmlFor="editTargetAmount" className="block text-sm font-medium text-gray-700">Target Amount ($)</label>
            <input id="editTargetAmount" type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" step="0.01" min="0.01" required />
          </div>
          <div>
            <label htmlFor="editDeadline" className="block text-sm font-medium text-gray-700">Deadline</label>
            <input id="editDeadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md" required />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGoalModal;