import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register the required Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BarChart = () => {
  const [data, setData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Inflation',
        data: [2.3, 3.1, 4.0],
        backgroundColor: '#4caf50', // Bar color
        borderRadius: 10,
        borderColor: '#388e3c',
        borderWidth: 2,
        hoverBackgroundColor: '#388e3c',
        hoverBorderColor: '#2c6e31',
      },
    ],
  });

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return tooltipItem.raw + '%'; // Add percentage sign in tooltips
          },
        },
      },
      legend: {
        position: 'top',
        labels: {
          color: '#444', // Change legend text color
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Months',
          color: '#444', // Axis title color
        },
        ticks: {
          color: '#444', // Axis ticks color
        },
      },
      y: {
        title: {
          display: true,
          text: 'Inflation (%)',
          color: '#444', // Axis title color
        },
        ticks: {
          color: '#444', // Axis ticks color
          callback: function (value) {
            return value + '%'; // Add percentage sign on the y-axis
          },
        },
      },
    },
    layout: {
      padding: {
        top: 30, // Adjust chart's top padding
      },
    },
  };

  return (
    <div>
      <h2 style={{ textAlign: 'center', color: '#444' }}></h2>
      <div>
        <Bar data={data} options={options} height={350} />
      </div>
    </div>
  );
};

export default BarChart;
