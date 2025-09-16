import { useEffect, useRef, useState } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css"; 

const RudderAngleGraph = ({
  time,
  rudderAngle,
  globalClockTime,
  liveData, 
}) => {
  const colors = ["red", "blue", "green", "orange", "purple", "yellow", "cyan", "magenta"]; // Add more colors if needed
  const [lineColors, setLineColors] = useState([]);
  const plotRef = useRef(null);
  const uPlotInstanceRef = useRef(null);

  // Filter time to only include every 8th element
  const filteredTime = time.filter((_, index) => (index + 1) % 8 === 0);

  useEffect(() => {
    const newLineColors = rudderAngle.map((_, index) => colors[index % colors.length]);
    setLineColors(newLineColors);
  }, [rudderAngle]);

  useEffect(() => {
    if (window.isLiveData && liveData) {
      const newLineColors = liveData.map((_, index) => colors[index % colors.length]);
      setLineColors(newLineColors);
    }
  }, [liveData]);

  // Calculate the current frame index based on globalClockTime
  const frameIndex = filteredTime.findIndex((t) => t >= globalClockTime);

  useEffect(() => {
    if (uPlotInstanceRef.current) {
      uPlotInstanceRef.current.destroy(); // Destroy previous uPlot instance
    }

    const options = {
      title: "Rudder Angle",
      width: 800,
      height: 200,
      scales: {
        x: { time: false },
        y: { auto: true },
      },
      axes: [
        {
          stroke: "black", // x-axis styling
        },
        {
          stroke: "black", // y-axis styling
          grid: { show: false }, // disable horizontal grid lines
        },
      ],
      series: [
        { label: "Rudder Angle", stroke: "black" },
        ...rudderAngle.map((_, index) => ({
          label: `Boat-${index + 1}`,
          stroke: lineColors[index],
          // Fix the value to no decimal places
          value: (_, rawValue) => (frameIndex !== -1 ? rudderAngle[index][frameIndex].toFixed(0) : 0),
        })),
      ],
      series: [
        { label: "Rudder Angle", stroke: "black" },
        ...(window.isLiveData ? liveData.map((data, index) => ({
          label: `Live Boat-${index + 1}`,
          stroke: lineColors[index],
          value: () => {
            // Handle the live data value here
            return data.rudderAngle ? data.rudderAngle.slice(-1)[0].toFixed(0) : 0; // Fix to no decimal places
          },
        })): rudderAngle.map((_, index) => ({
          label: `Boat-${index + 1}`,
          stroke: lineColors[index],
          // Fix the value to no decimal places
          value: (_, rawValue) => (frameIndex !== -1 ? rudderAngle[index][frameIndex].toFixed(0) : 0),
        }))),
      ],
    };

    const data = [
      window.isLiveData 
        ? liveData.map((dataEntry) => dataEntry.time).flat() // X-axis time values from live data
        : filteredTime.slice(0, frameIndex + 1), // X-axis time values from regular data
    
      ...(window.isLiveData 
        ? liveData.map((dataEntry) => dataEntry.rudderAngle) // Y-axis values from live data
        : rudderAngle.map((rudderAngleData) => rudderAngleData.slice(0, frameIndex + 1)) // Y-axis values from regular data
      ),
    ];

    uPlotInstanceRef.current = new uPlot(options, data, plotRef.current);

    // Access the legend container after the chart is rendered
    const legendContainer = plotRef.current.querySelector('.u-legend');

    if (legendContainer) {
      const labels = legendContainer.querySelectorAll('.u-label');

      labels.forEach((label, index) => {
        // Add hover interaction to bold the line when the mouse is over a label
        label.addEventListener("mouseenter", () => {
          const series = uPlotInstanceRef.current.series[index];
          series.width = 5; // Bold the line
          uPlotInstanceRef.current.redraw(); // Redraw the plot to reflect the new width
        });

        // When the mouse leaves the label, return the line to its original width
        label.addEventListener("mouseleave", () => {
          const series = uPlotInstanceRef.current.series[index];
          series.width = 1; 
          uPlotInstanceRef.current.redraw();
        });
      });
    }

    return () => {
      uPlotInstanceRef.current.destroy();
      uPlotInstanceRef.current = null;
    };
  }, [rudderAngle, globalClockTime, lineColors, filteredTime, frameIndex, liveData]);

  return (
    <div>
      <div ref={plotRef} />
    </div>
  );
};

export default RudderAngleGraph;
