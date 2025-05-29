import React, { useState } from 'react';
import { AddTransactionFn } from '../../hooks/useTransactions';

interface AddTransactionProps {
  onAdd: AddTransactionFn;
}

const AddTransaction: React.FC<AddTransactionProps> = ({ onAdd }) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !category.trim()) {
      setError('Please fill in amount and category correctly.');
      return;
    }

    setLoading(true);
    try {
      await onAdd(amt, type, category.trim(), description.trim(), date);
      // reset
      setAmount('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
      <h3 className="font-medium text-gray-800">Add Transaction</h3>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Amount */}
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        step="0.01"
        min="0.01"
        onChange={(e) => setAmount(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />

      {/* Type */}
      <select
        value={type}
        onChange={(e) => setType(e.target.value as 'income' | 'expense')}
        className="w-full border p-2 rounded"
      >
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>

      {/* Category */}
      <input
        type="text"
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />

      {/* Description */}
      <input
        type="text"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border p-2 rounded"
      />

      {/* Date */}
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-60"
      >
        {loading ? 'Saving…' : 'Add'}
      </button>
    </form>
  );
};

export default AddTransaction;
