import Plot from "react-plotly.js";

// Colors for different boats (loop if more boats than colors)
const COLORS = ["red", "blue", "green", "orange", "purple", "yellow", "cyan", "magenta"];

const BaseChart = ({
  title,        // chart title
  dataSeries,   // array of boat data (each boat = array of numbers)
  yAxisLabel = "", 
  time,         // x-axis values (time array)
  frameIndex,   // current frame index
  isRunning,    // true if replay is running
}) => {
  const series = dataSeries || [];

  // Cut time array up to current frame
  const slicedTime = time ? time.slice(0, frameIndex + 1) : [];

  // Build plotly data for each boat
  const data = series.map((boatData, index) => ({
    x: slicedTime, 
    y: boatData.slice(0, frameIndex + 1), // cut boat data to current frame
    type: 'scatter',
    mode: 'lines',
    line: { color: COLORS[index % COLORS.length], width: 2 },
    name: `Boat-${index + 1}`, // legend name
  }));

  // Vertical line at current frame (only if running)
  const shapes = isRunning && time && time.length > 0 && frameIndex !== -1
    ? [{
        type: 'line',
        x0: time[frameIndex], x1: time[frameIndex], // vertical line at current time
        y0: 0,
        y1: 1,
        yref: 'paper', // relative to paper (0 = bottom, 1 = top)
        line: { color: 'grey', width: 1, dash: 'dot' },
      }]
    : [];

  return (
    <div className="graph-plot-container">
      <Plot
        data={data}
        layout={{
          title, 
          autosize: true,
          font: { size: 10 },
          margin: { l: 40, r: 20, b: 30, t: 40, pad: 4 },
          xaxis: { title: "" },
          yaxis: { title: yAxisLabel },
          showlegend: true,
          legend: { x: 0, y: 0, xanchor: 'left', yanchor: 'bottom', },
          shapes: shapes, // vertical line if running
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default BaseChart;
