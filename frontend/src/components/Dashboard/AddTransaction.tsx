// src/components/Dashboard/AddTransaction.tsx
import React, { useState } from 'react';

interface AddTransactionProps {
  onAdd: (
    amount: number,
    type: 'income' | 'expense',
    category: string,
    description: string,
    transactionDate: string
  ) => Promise<void>;
}

const AddTransaction: React.FC<AddTransactionProps> = ({ onAdd }) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAdd(
      Number(amount),
      type,
      category,
      description,
      transactionDate
    );
    // Очистити форму
    setAmount('');
    setCategory('');
    setDescription('');
    setTransactionDate('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded">
      <div>
        <label>Amount:</label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required
          className="w-full border px-2 py-1"
        />
      </div>
      <div>
        <label>Type:</label>
        <select
          value={type}
          onChange={e => setType(e.target.value as 'income' | 'expense')}
          className="w-full border px-2 py-1"
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>
      <div>
        <label>Category:</label>
        <input
          type="text"
          value={category}
          onChange={e => setCategory(e.target.value)}
          required
          className="w-full border px-2 py-1"
        />
      </div>
      <div>
        <label>Description:</label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full border px-2 py-1"
        />
      </div>
      <div>
        <label>Date:</label>
        <input
          type="date"
          value={transactionDate}
          onChange={e => setTransactionDate(e.target.value)}
          required
          className="w-full border px-2 py-1"
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Add Transaction
      </button>
    </form>
  );
};

export default AddTransaction;

