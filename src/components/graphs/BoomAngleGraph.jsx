import { useEffect, useRef, useState } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

const BoomAngleGraph = ({
  time,
  boomAngle,
  globalClockTime,
  liveData,
}) => {
  const colors = ["red", "blue", "green", "orange", "purple", "yellow", "cyan", "magenta"];
  const [lineColors, setLineColors] = useState([]);
  const plotRef = useRef(null);
  const uPlotInstanceRef = useRef(null);

  // Filter time to take every 8th element
  const filteredTime = time.filter((_, index) => (index + 1) % 8 === 0);

  useEffect(() => {
    const newLineColors = boomAngle.map((_, index) => colors[index % colors.length]);
    setLineColors(newLineColors);
  }, [boomAngle]);

  useEffect(() => {
    if (window.isLiveData && liveData) {
      const newLineColors = liveData.map((_, index) => colors[index % colors.length]);
      setLineColors(newLineColors);
    }
  }, [liveData]);


  const frameIndex = filteredTime.findIndex((t) => t >= globalClockTime);

  useEffect(() => {
    if (uPlotInstanceRef.current) {
      uPlotInstanceRef.current.destroy();
    }

    const options = {
      title: "Boom Angle",
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
        { label: "Boom Angle", stroke: "black" },        
        ...(window.isLiveData ? liveData.map((data, index) => (          // { label: `Boat-${index + 1} Time`, show: false }, // X-axis for new boat
          {
          label: `Live Boat-${index + 1}`,
          stroke: lineColors[index],
          value: () => {
            // Handle the live data value here, e.g., assuming `data` has a value for the boom angle
            return data.boomAngle ? data.boomAngle.slice(-1)[0].toFixed(0) : 0; // Fix to no decimal places
          },
        })): boomAngle.map((_, index) => ({
          label: `Boat-${index + 1}`,
          stroke: lineColors[index],
          value: (_, rawValue) =>
            //fix to no decimal places
            frameIndex !== -1 ? boomAngle[index][frameIndex].toFixed(0) : 0, 
        }))),
      ],
    };
    
    const data = [      
      window.isLiveData 
        ? liveData.map((dataEntry) => dataEntry.time).flat() // X-axis time values from live data        
        : filteredTime.slice(0, frameIndex + 1), // X-axis time values from regular data
    
      ...(window.isLiveData 
        ? liveData.map((dataEntry) => dataEntry.boomAngle) // Y-axis boom angle values from live data
        : boomAngle.map((angleData) => angleData.slice(0, frameIndex + 1)) // Y-axis boom angle values from regular data
      ),
    ];    

    // let data;

    // if (window.isLiveData) {
    //   data = liveData.map((dataEntry) => [dataEntry.time, dataEntry.boomAngle]).flat();
    //   console.log("live data graph Data:", data);
    // } else {
    //   data = [filteredTime.slice(0, frameIndex + 1), ...boomAngle.map((angleData) => angleData.slice(0, frameIndex + 1))];
    //   console.log("regular data graph Data:", data);
    // }   

    // if (uPlotInstanceRef.current && liveData.length) {
    //   if (liveData.length > 1) {
    //     for (let i = 1; i < liveData.length; i++) {
    //       const timeOffset = liveData[i].time[0] - liveData[0].time[0];
    //       console.log("Time Offset:", timeOffset);
    //       const alignedTime = liveData[i].time.map(t => t + timeOffset); // Shift times by offset
    //       console.log("Aligned Time:", alignedTime);
    //       const newData = [alignedTime, liveData[i].boomAngle]; // Combine the time and boom angle data
    //       console.log("New Data:", newData);
    //       // Add the new series dynamically with the adjusted time
    //       uPlotInstanceRef.current.setData([...newData]);
    //     }
    //   }
    // }


    uPlotInstanceRef.current = new uPlot(options, data, plotRef.current);

    // Access the legend container after the chart is rendered
    const legendContainer = plotRef.current.querySelector('.u-legend');

    if (legendContainer) {
      const labels = legendContainer.querySelectorAll('.u-label');

      labels.forEach((label, index) => {
        // Add hover interaction to bold the line when the mouse is over a label
        label.addEventListener("mouseenter", () => {
          const series = uPlotInstanceRef.current.series[index]; // Correct the series index
          series.width = 5; 
          uPlotInstanceRef.current.redraw(); // Redraw the plot to reflect the new width
        });

        // When the mouse leaves the label, return the line to its original width
        label.addEventListener("mouseleave", () => {
          const series = uPlotInstanceRef.current.series[index];
          series.width = index ? 5 : 1; 
          uPlotInstanceRef.current.redraw();
        });
      });
    }

    return () => {
      uPlotInstanceRef.current.destroy();
      uPlotInstanceRef.current = null;
    };
  }, [boomAngle, globalClockTime, lineColors, filteredTime, frameIndex, liveData]);  

  return (
    <div>
      <div ref={plotRef} />
    </div>
  );
};

export default BoomAngleGraph;
