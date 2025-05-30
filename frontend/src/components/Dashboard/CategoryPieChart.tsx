// frontend/src/components/Dashboard/CategoryPieChart.tsx
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title, ChartOptions, FontSpec } from 'chart.js'; // Додано ChartOptions, FontSpec для типізації
import { CategoryExpense } from '../../types/types';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface CategoryPieChartProps {
  categoryExpenses: CategoryExpense[];
  loading?: boolean;
  title?: string;
}

const DEFAULT_COLORS = [
  '#4CAF50', '#2196F3', '#FFC107', '#FF5722', '#9C27B0',
  '#00BCD4', '#8BC34A', '#FF9800', '#E91E63', '#607D8B',
  '#795548', '#03A9F4', '#CDDC39', '#FFEB3B', '#F44336',
];

// Типізація для Chart.js опцій
type PieChartOptions = ChartOptions<'pie'>; // Використовуємо тип з Chart.js

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ 
  categoryExpenses, 
  loading,
  title = 'Expenses by Category (Current Month)' 
}) => {

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md h-80 md:h-96 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="ml-3 text-gray-500">Loading chart data...</p>
      </div>
    );
  }
  
  if (!categoryExpenses || categoryExpenses.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md h-80 md:h-96 flex justify-center items-center">
        <p className="text-center text-gray-500">
          No expense data available for categories this month. <br/>
          Add some expenses to see the chart.
        </p>
      </div>
    );
  }

  const sortedExpenses = [...categoryExpenses].sort((a, b) => b.totalAmount - a.totalAmount);
  const topN = 10;
  let chartLabels = sortedExpenses.slice(0, topN).map(item => item.category);
  let chartDataPoints = sortedExpenses.slice(0, topN).map(item => item.totalAmount);
  
  if (sortedExpenses.length > topN) {
    const otherAmount = sortedExpenses.slice(topN).reduce((sum, item) => sum + item.totalAmount, 0);
    if (otherAmount > 0) {
      chartLabels.push('Other');
      chartDataPoints.push(otherAmount);
    }
  }

  const chartBackgroundColors = chartLabels.map((_, index) => DEFAULT_COLORS[index % DEFAULT_COLORS.length]);

  const data = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Expenses',
        data: chartDataPoints,
        backgroundColor: chartBackgroundColors,
        borderColor: '#FFFFFF',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  // ВИПРАВЛЕНО: plugins.title.font.weight
  const options: PieChartOptions = { // Явно вказуємо тип для options
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 15,
          boxWidth: 12,
          font: { // Тип для font тут Partial<FontSpec>
            size: 13,
          },
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: title,
        font: { // Тип для font тут Partial<FontSpec>
          size: 18,
          weight: 'bold', // Змінено '600' на 'bold' (або можна 600 як число)
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0,0,0,0.7)',
        titleFont: { size: 14, weight: 'bold' as const }, // тут теж можна 'bold'
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 4,
        callbacks: {
          label: function(context: any) { // context тут має тип TooltipItem<'pie'>
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            // context.parsed - це числове значення для pie/doughnut
            if (context.parsed !== null && context.parsed !== undefined) { 
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed);
              // Додавання відсотка
              const total = context.dataset.data.reduce((sum: number, val: number) => sum + (typeof val === 'number' ? val : 0) , 0);
              if (total > 0) {
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                label += ` (${percentage}%)`;
              }
            }
            return label;
          }
        }
      }
    },
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md h-96 md:h-[450px]">
      <Pie data={data} options={options} />
    </div>
  );
};

export default CategoryPieChart;