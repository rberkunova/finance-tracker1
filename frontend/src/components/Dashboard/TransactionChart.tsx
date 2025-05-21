import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Transaction } from '../../types/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TransactionChart = ({ transactions }: { transactions: Transaction[] }) => {
  // Group transactions by date and type
  const groupedData = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.transaction_date).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { income: 0, expense: 0 };
    }
    if (transaction.type === 'income') {
      acc[date].income += transaction.amount;
    } else {
      acc[date].expense += transaction.amount;
    }
    return acc;
  }, {} as Record<string, { income: number; expense: number }>);

  const dates = Object.keys(groupedData).sort();
  const incomeData = dates.map(date => groupedData[date].income);
  const expenseData = dates.map(date => groupedData[date].expense);

  const data = {
    labels: dates,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        tension: 0.1,
      },
      {
        label: 'Expense',
        data: expenseData,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Income vs Expenses',
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <Line data={data} options={options} />
    </div>
  );
};

export default TransactionChart;