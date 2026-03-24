import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CategoryChart = ({ breakdown }) => {
  const safeBreakdown = Array.isArray(breakdown) ? breakdown : [];

  const data = {
    labels: safeBreakdown.map((item) => item.category),
    datasets: [
      {
        label: 'Achievements',
        data: safeBreakdown.map((item) => item.count),
        borderRadius: 8,
        backgroundColor: ['#0f766e', '#1d4ed8', '#16a34a', '#f59e0b'],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Category Breakdown</h3>
      <p className="mt-1 text-sm text-slate-500">Achievement distribution across categories</p>
      <div className="mt-4 h-72">
        <Bar
          key={safeBreakdown.map((item) => `${item.category}-${item.count}`).join('|')}
          data={data}
          options={options}
          redraw
        />
      </div>
    </div>
  );
};

export default CategoryChart;
