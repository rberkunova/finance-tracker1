import { FinancialSummary } from '../../types/types';

const StatsCard = ({ summary }: { summary: FinancialSummary | null }) => {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-500">Total Income</h3>
        <p className="mt-2 text-3xl font-bold text-green-600">${summary.totalIncome.toFixed(2)}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-500">Total Expenses</h3>
        <p className="mt-2 text-3xl font-bold text-red-600">${summary.totalExpenses.toFixed(2)}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-500">Balance</h3>
        <p className={`mt-2 text-3xl font-bold ${
          summary.balance >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          ${summary.balance.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default StatsCard;