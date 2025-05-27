// frontend/src/components/Dashboard/TransactionChart.tsx
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
  TimeScale, // Можливо, знадобиться для кращого відображення дат
  Filler,    // Для заливки під лініями
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // Адаптер для дат
import { Transaction } from '../../types/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale, // Реєструємо TimeScale
  Filler
);

interface TransactionChartProps {
    transactions: Transaction[];
}

const TransactionChart: React.FC<TransactionChartProps> = ({ transactions }) => {
  // Сортуємо транзакції за датою для коректного відображення на графіку
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
  );

  // Групуємо дані за датою (можна залишити як є, або покращити для агрегації по днях/місяцях)
  const dailyData = sortedTransactions.reduce((acc, transaction) => {
    // Використовуємо transaction.transactionDate
    const date = new Date(transaction.transactionDate).toISOString().split('T')[0]; // Нормалізуємо до YYYY-MM-DD
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

  const labels = Object.keys(dailyData).sort(); // Дати вже відсортовані

  const incomeData = labels.map(date => dailyData[date].income);
  const expenseData = labels.map(date => dailyData[date].expense);

  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.1,
      },
      {
        label: 'Expense',
        data: expenseData,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Income vs Expenses Over Time',
        font: {
            size: 16,
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        type: 'time' as const, // Використовуємо шкалу часу
        time: {
          unit: 'day' as const, // Одиниця виміру
          tooltipFormat: 'MMM dd, yyyy', // Формат для підказок
          displayFormats: {
            day: 'MMM dd' // Формат відображення на осі X
          }
        },
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount ($)'
        }
      },
    },
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-8 h-96"> {/* Задаємо висоту */}
      {transactions.length > 0 ? (
        <Line data={data} options={options} />
      ) : (
        <p className="text-center text-gray-500 py-10">No transaction data available for chart.</p>
      )}
    </div>
  );
};

export default TransactionChart;
