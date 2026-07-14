import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const LineChart = ({ impressions = [], clicks = [], labels = [] }) => {
  // Calculate CTR (%)
  const ctr = impressions.map((imp, i) => {
    const clk = clicks[i] ?? 0;
    return imp ? parseFloat(((clk / imp) * 100).toFixed(2)) : 0;
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Impressions',
        data: impressions,
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y',
      },
      {
        label: 'Clicks',
        data: clicks,
        borderColor: '#FF6384',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y',
      },
      {
        label: 'CTR (%)',
        data: ctr,
        borderColor: '#FFA500',
        backgroundColor: 'rgba(255, 165, 0, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y1', // Right Y axis
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
  title: (tooltipItems) => `Date: ${tooltipItems[0].label}`,
  label: (tooltipItem) => {
    const datasetLabel = tooltipItem.dataset.label || '';
    const value = tooltipItem.raw;
    if (datasetLabel === 'CTR (%)') {
      return `${datasetLabel}: ${value}%`;
    }
    return `${datasetLabel}: ${value}`;
  },
},

      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          boxWidth: 12,
          font: { size: 12 },
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          font: { size: 13 },
        },
        ticks: {
          maxRotation: 45,
          minRotation: 20,
          autoSkip: true,
        },
        grid: {
          display: false,
        },
      },
      y: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Impressions / Clicks',
          font: { size: 13 },
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.1)',
        },
      },
      y1: {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        title: {
          display: true,
          text: 'CTR (%)',
          font: { size: 13 },
        },
        grid: {
          drawOnChartArea: false, // Disable extra grid lines
        },
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '300px', margin: '0 auto' }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default LineChart;
