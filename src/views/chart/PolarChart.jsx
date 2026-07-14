import React, { useState } from 'react';
import { PolarArea } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, RadialLinearScale } from 'chart.js';

// Register necessary components for Chart.js
ChartJS.register(Title, Tooltip, Legend, ArcElement, RadialLinearScale);

const PolarChart = () => {
  const [state] = useState({
    series: [14, 23, 21, 17, 15, 10, 12, 17, 21],
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.label}: ${context.raw}`;
            },
          },
        },
      },
      scales: {
        r: {
          beginAtZero: true, // Ensures radial scale starts at zero
        },
      },
    },
  });

  // Define data for the PolarArea chart
  const data = {
    labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'], // Labels for chart segments
    datasets: [
      {
        label: 'Series Data',
        data: state.series, // Values for each chart segment
        backgroundColor: [
          '#FF5733', '#33FF57', '#3357FF', '#F5A623', '#9B59B6',
          '#F39C12', '#E74C3C', '#8E44AD', '#2C3E50', // Colors for chart segments
        ],
      },
    ],
  };

  return (
    <div>
      <div id="chart">
        {/* Render PolarArea chart */}
        <PolarArea data={data} options={state.options} />
      </div>
      <div id="html-dist"></div>
    </div>
  );
};

export default PolarChart;
