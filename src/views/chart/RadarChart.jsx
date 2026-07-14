import React from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler, ArcElement } from 'chart.js';

// Register the components required by Chart.js
ChartJS.register(Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler, ArcElement);

const RadarChart = () => {
  // Chart.js data and options
  const data = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June'], // X-axis categories
    datasets: [
      {
        label: 'Series 1',
        data: [80, 50, 30, 40, 100, 20], // Data for the radar chart
        fill: true, // To fill the area under the line
        backgroundColor: '#cce9fe', // Fill color
        borderColor: '#008ffb', // Border color
        borderWidth: 1
      } 
    ]
  };

  const options = {
    responsive: true, // Make the chart responsive
    scale: {
      ticks: {
        stepSize: 20, // Set the step size for the y-axis
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Basic Radar Chart', // Title of the chart
      }
    }
  };

  return (
    <div>
      <Radar data={data} options={options} />
    </div>
  );
}

export default RadarChart;
