import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import Crosswind_Small from "../../data/course/Crosswind_Small.json";
import Crosswind_Big from "../../data/course/Crosswind_Big.json";
import Trapezoid_Small from "../../data/course/Trapezoid_Small.json";
import Trapezoid_Big from "../../data/course/Trapezoid_Big.json";
import Triangular_Small from "../../data/course/Triangular_Small.json";
import Triangular_Big from "../../data/course/Triangular_Big.json";
import UpDown_Small from "../../data/course/UpDown_Small.json";
import UpDown_Big from "../../data/course/UpDown_Big.json";
import { useClock } from "../../contexts/ClockContext";

let course_data;

async function importCourseData(courseData) {
  try {
    switch (courseData) {
      case "1,0":
        course_data = Crosswind_Small;
        break;
      case "1,1":
        course_data = Crosswind_Big;
        break;
      case "2,0":
        course_data = Trapezoid_Small;
        break;
      case "2,1":
        course_data = Trapezoid_Big;
        break;
      case "3,0":
        course_data = Triangular_Small;
        break;
      case "3,1":
        course_data = Triangular_Big;
        break;
      case "4,0":
        course_data = UpDown_Small;
        break;
      case "4,1":
        course_data = UpDown_Big;
        break;
      default:
        console.error("Invalid course data:", courseData);
    }
  } catch (e) {
    console.error(`Error importing JSON data: ${e}`);
  }
}

const Map = ({ allData }) => {
  const { globalClockTime } = useClock();
  const [plotData, setPlotData] = useState([]);
  const [XYData, setXYData] = useState([]);
  const [boatPaths, setBoatPaths] = useState({}); // Initialize state for boat paths in live data mode  

  // function to set the boat paths in live data mode
  const setBoatPathsLiveData = (allData) => {
    setBoatPaths((prevBoatPaths) => {
      const updatedBoatPaths = { ...prevBoatPaths };

      allData.forEach((boatData, index) => {
        const { X_Position, Y_Position, time } = boatData;

        // Initialize arrays if not already present for each boat
        if (!updatedBoatPaths[index]) {
          updatedBoatPaths[index] = {
            time: [],
            X_Position: [],
            Y_Position: [],
          };
        }

        // Append new data to the existing boat's path
        updatedBoatPaths[index].time.push(...time);
        updatedBoatPaths[index].X_Position.push(...X_Position);
        updatedBoatPaths[index].Y_Position.push(...Y_Position);
      });

      return updatedBoatPaths;
    });
  };

  function transformBoatPathsToSBPFormat(boatPaths) {
    const sbpData = Object.keys(boatPaths).map((boatIndex) => {
      const boatData = boatPaths[boatIndex]; // Access the boat's path data
  
      return {
        X_Position: boatData.X_Position,  // Array of X positions
        Y_Position: boatData.Y_Position,  // Array of Y positions
        time: boatData.time,  // Array of timestamps
      };
    });
  
    return sbpData;
  } 

  // Effect to set boat paths in live data mode
  useEffect(() => {
    if (allData.length > 0) {
      setBoatPathsLiveData(allData);
      const sbpData = transformBoatPathsToSBPFormat(boatPaths);      
      if (window.isLiveData) {
        allData = sbpData;  // Set the data to the boat paths in live data mode        
      }
    }    
  }, [allData]);

  // Effect to process all data when it changes
  useEffect(() => {
    if (allData.length > 0) {
      const newXYData = [];

      allData.forEach((fileData, fileIndex) => {
        const { X_Position, Y_Position, time } = fileData;

        if (
          X_Position &&
          Y_Position &&
          X_Position.length === Y_Position.length &&
          time !== "NaN"
        ) {
          let fileXYData = [];

          for (let i = 1; i < X_Position.length; i++) {
            fileXYData.push({
              X: X_Position[i],
              Y: Y_Position[i],
              time: time[i],
              FileIndex: fileIndex,
            });
          }
          newXYData.push(fileXYData);
        }
      });

      setXYData(newXYData);
    }
  }, [allData]);

  // Effect to update the boat positions on each clock tick
  useEffect(() => {
    if (
      XYData.length > 0 &&
      globalClockTime >= Math.min(...XYData.map((d) => d[0]?.time))
    ) {
      moveBoat();
    }
  }, [globalClockTime]);

  function moveBoat() {
    const updatedPlotData = [];

    XYData.forEach((fileXYData, fileIndex) => {
      const currentGlobalTime = globalClockTime;

      const positionsToRender = fileXYData.filter(
        (pos) => pos.time <= currentGlobalTime
      );

      if (positionsToRender.length > 0) {
        const latestPosition = positionsToRender[positionsToRender.length - 1];
        updatedPlotData.push({
          x: [latestPosition.X],
          y: [latestPosition.Y],
          type: "scatter",
          mode: "markers",
          marker: {
            color: getRandomColor(fileIndex),
            size: 10,
          },
          showlegend: false,
        });

        const pathX = positionsToRender.map((pos) => pos.X);
        const pathY = positionsToRender.map((pos) => pos.Y);
        updatedPlotData.push({
          x: pathX,
          y: pathY,
          type: "scatter",
          mode: "lines",
          line: {
            color: getRandomColor(fileIndex),
            width: 2,
          },
          showlegend: true,
          name: "Boat-" + (fileIndex + 1),
        });
      }
    });

    setPlotData(updatedPlotData);
  }

  function getRandomColor(index) {
    const colors = [
      "red",
      "blue",
      "green",
      "orange",
      "purple",
      "yellow",
      "cyan",
      "magenta",
    ];
    return colors[index % colors.length];
  }

  return (
    <div>
      {/* add title to the map and make it in the center*/}
      <h3 style={{ textAlign: "center" }}>Race Track Map</h3>

      <Plot
        data={plotData}
        layout={{
          xaxis: {
            showticklabels: false,
          },
          yaxis: {
            showticklabels: false,
          },
          connectgaps: false,
        }}
      />
    </div>
  );
};

export default Map;
