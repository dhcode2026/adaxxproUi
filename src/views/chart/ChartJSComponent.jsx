import React, { useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Registering necessary Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const ChartJSComponent = () => {
  const [data, setData] = useState({
    labels: ['Campaigns 1', 'Campaigns 2', 'Campaigns 3', 'Campaigns 4', 'Campaigns 5'],
    datasets: [
      {
        data: [44, 55, 13, 43, 22],
        backgroundColor: ['#FF5733', '#33FF57', '#3357FF', '#FF33A8', '#33C8FF'],
        hoverOffset: 4,
      },
    ],
  });

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',  // You can adjust the legend position as needed
      },
    },
  };

  return (
    <div>
      <div id="chart">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
};

export default ChartJSComponent;
