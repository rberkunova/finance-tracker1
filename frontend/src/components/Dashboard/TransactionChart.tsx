// frontend/src/components/Dashboard/TransactionChart.tsx
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Transaction } from '../../types/types'; // Переконайтесь, що шлях правильний

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, Filler
);

interface TransactionChartProps {
  transactions: Transaction[];
  loading?: boolean; // <-- НОВИЙ ПРОП
}

const TransactionChart: React.FC<TransactionChartProps> = ({ transactions, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md h-96 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="ml-3 text-gray-500">Loading chart data...</p>
      </div>
    );
  }

  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
  );

  const dailyData = sortedTransactions.reduce((acc, transaction) => {
    const date = new Date(transaction.transactionDate).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { income: 0, expense: 0 };
    }
    if (transaction.type === 'income') {
      acc[date].income += Number(transaction.amount);
    } else {
      acc[date].expense += Number(transaction.amount);
    }
    return acc;
  }, {} as Record<string, { income: number; expense: number }>);

  const labels = Object.keys(dailyData).sort(); 

  const incomeData = labels.map(date => dailyData[date].income);
  const expenseData = labels.map(date => dailyData[date].expense);

  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Income', data: incomeData, borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)', fill: true, tension: 0.1,
      },
      {
        label: 'Expense', data: expenseData, borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)', fill: true, tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Income vs Expenses Over Time', font: { size: 16 } },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: {
        type: 'time' as const, time: { unit: 'day' as const, tooltipFormat: 'MMM dd, yyyy', displayFormats: { day: 'MMM dd' } },
        title: { display: true, text: 'Date' }
      },
      y: { beginAtZero: true, title: { display: true, text: 'Amount ($)' } },
    },
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md h-96">
      {transactions.length > 0 ? (
        <Line data={data} options={options} />
      ) : (
        <p className="text-center text-gray-500 py-10 h-full flex items-center justify-center">
          No transaction data available to display the chart.
        </p>
      )}
    </div>
  );
};

export default TransactionChart;