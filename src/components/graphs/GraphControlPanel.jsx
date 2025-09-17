import { useEffect, useReducer, useState } from "react";
import "../../assets/main.css";
import BoomAngleGraph from "./BoomAngleGraph";
import FwdVelocityGraph from "./FwdVelocityGraph";
import HeadingGraph from "./HeadingGraph";
import HeelAngleGraph from "./HeelAngleGraph";
import HikingEffortGraph from "./HikingEffortGraph";
import RudderAngleGraph from "./RudderAngleGraph";
import WindVelocityGraph from "./WindVelocityGraph";


const GraphOptions = [
  "BOOM_ANGLE",
  "FWD_VELOCITY",
  "HEADING",
  "HEEL_ANGLE",
  "HIKING_EFFORT",
  "RUDDER_ANGLE",
  "WIND_VELOCITY",
];

const GraphControlPanel = ({
  boomAngle,
  fwdVelo,
  heelAngle,
  heading,
  hiking,
  rudderAngle,
  time,
  windVelo,
  globalClockTime,
  isAssetLoaded,
  allData,
}) => {
  let maxTimeLength = 0;
  let maxTimeIndex = 0;

  const [boatPaths, setBoatPaths] = useState({}); // Initialize state for boat paths in live data mode
  const [liveData, setLiveData] = useState([]);  // Initialize state for live data 

  // function to set the boat paths in live data mode
  const setBoatPathsLiveData = (allData) => {
    setBoatPaths((prevBoatPaths) => {
      const updatedBoatPaths = { ...prevBoatPaths };

      allData.forEach((boatData, index) => {
        const { 
          time, 
          metadata,
          courseData,
          boatId,
          name,
          X_Position,
          Y_Position,
          headingRadians,
          fwdVelocity,
          hikingEffect,
          boomAngle,
          heelAngle,
          heading,
          rudderAngle,
          windVelo,
         } = boatData;

        // Initialize arrays if not already present for each boat
        if (!updatedBoatPaths[index]) {
          updatedBoatPaths[index] = {
            time: [],
            X_Position: [],
            Y_Position: [],
            metadata,
            courseData,
            boatId,
            name,
            headingRadians: [],
            fwdVelocity: [],
            hikingEffect: [],
            boomAngle: [],
            heelAngle: [],
            heading: [],
            rudderAngle: [],
            windVelo: [],            
          };
        }

        // Append new data to the existing boat's path
        updatedBoatPaths[index].time.push(...time);
        updatedBoatPaths[index].X_Position.push(...X_Position);
        updatedBoatPaths[index].Y_Position.push(...Y_Position);
        updatedBoatPaths[index].headingRadians.push(...headingRadians);
        updatedBoatPaths[index].fwdVelocity.push(...fwdVelocity);
        updatedBoatPaths[index].hikingEffect.push(...hikingEffect);
        updatedBoatPaths[index].boomAngle.push(...boomAngle);
        updatedBoatPaths[index].heelAngle.push(...heelAngle);
        updatedBoatPaths[index].heading.push(...heading);
        updatedBoatPaths[index].rudderAngle.push(...rudderAngle);
        updatedBoatPaths[index].windVelo.push(...windVelo);        
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
        headingRadians: boatData.headingRadians,
        fwdVelocity: boatData.fwdVelocity,
        hikingEffect: boatData.hikingEffect,
        boomAngle: boatData.boomAngle,
        heelAngle: boatData.heelAngle,
        heading: boatData.heading,
        rudderAngle: boatData.rudderAngle,
        windVelo: boatData.windVelo,
        metadata: boatData.metadata,
        courseData: boatData.courseData,
        boatId: boatData.boatId,
        name: boatData.name,
      };
    });
  
    return sbpData;
  } 
  
  // Effect to set boat paths in live data mode
  useEffect(() => {
    if (allData.length > 0) {
      setBoatPathsLiveData(allData);      
    }    
  }, [allData]);

  useEffect(() => {    
    const sbpData = transformBoatPathsToSBPFormat(boatPaths);
    if (window.isLiveData) {
      setLiveData(sbpData);  // Set the data to the boat paths in live data mode                
    } 
  }, [boatPaths]);

  console.log("New Live Data:", liveData);
  
  allData.forEach((fileData, index) => {
    if (fileData.time.length > maxTimeLength) {
      maxTimeLength = fileData.time.length;
      maxTimeIndex = index;
    }
  });

  const FileTime = allData[maxTimeIndex].time; 

  const [frameIndex, setFrameIndex] = useState(0);
  const [proccessTime, setProcessTime] = useState([]);
  const [proccessFwd, setProcessFwd] = useState([]);
  const [proccessHiking, setProcessHiking] = useState([]);
  const [plotsDispState, togglePlotsDispState] = useReducer(
    (_plotsDispState, plotsDispStateChange) =>
      _plotsDispState.includes(plotsDispStateChange.type)
        ? _plotsDispState.filter((s) => s !== plotsDispStateChange.type)
        : [
            ...(_plotsDispState.length === 2
              ? _plotsDispState.slice(1)
              : _plotsDispState),
            plotsDispStateChange.type,
          ],
    ["FWD_VELOCITY", "WIND_VELOCITY"]
  );

  useEffect(() => {
    const timeValue = FileTime.map((_time) => _time.time);
    setProcessTime(timeValue);

    const fwdValue = fwdVelo.map((_fwd) => _fwd.fwd_velocity);
    setProcessFwd(fwdValue);

    const hikingValue = hiking.map((_hiking) => _hiking.hiking_effect);
    setProcessHiking(hikingValue);
  }, []);

  useEffect(() => {
    // 根据 globalClockTime 计算新的 frameIndex
    const newIndex = FileTime.findIndex((t) => t >= globalClockTime);
    if (newIndex !== -1 && newIndex !== frameIndex) {
      setFrameIndex(newIndex);
    }
  }, [globalClockTime, FileTime, frameIndex]);  

  return (
    <div className="graph_panel">
      <div style={{ width: "250px", paddingLeft: "30px" }}>
        {GraphOptions.map((option, i) => (
          <p key={i} style={{ color: `black` }}>
            <input
              type={`checkbox`}
              name={option}
              checked={plotsDispState.includes(option)}
              onChange={(event) =>
                togglePlotsDispState({ type: event.target.name })
              }
            />
            {option}
          </p>
        ))}
      </div>
      <div className="graph_container">
        {plotsDispState.map(
          (dispState) =>
            (dispState === "BOOM_ANGLE" && (
              <BoomAngleGraph
                time={FileTime}
                boomAngle={boomAngle}
                isRunning={isAssetLoaded}
                frameIndex={frameIndex}
                globalClockTime={globalClockTime}
                liveData={liveData}
              />
            )) ||
            (dispState === "FWD_VELOCITY" && (
              <FwdVelocityGraph
                time={FileTime}
                fwdVelo={fwdVelo}
                isRunning={isAssetLoaded}
                frameIndex={frameIndex}
                globalClockTime={globalClockTime}
                liveData={liveData}
              />
            )) ||
            (dispState === "HEADING" && (
              <HeadingGraph
                time={FileTime}
                heading={heading}
                isRunning={isAssetLoaded}
                frameIndex={frameIndex}
                globalClockTime={globalClockTime}
                liveData={liveData}
              />
            )) ||
            (dispState === "HEEL_ANGLE" && (
              <HeelAngleGraph
                time={FileTime}
                heelAngle={heelAngle}
                isRunning={isAssetLoaded}
                frameIndex={frameIndex}
                globalClockTime={globalClockTime}
                liveData={liveData}
              />
            )) ||
            (dispState === "HIKING_EFFORT" && (
              <HikingEffortGraph
                time={FileTime}
                hiking={hiking}
                isRunning={isAssetLoaded}
                frameIndex={frameIndex}
                globalClockTime={globalClockTime}
                liveData={liveData}
              />
            )) ||
            (dispState === "RUDDER_ANGLE" && (
              <RudderAngleGraph
                time={FileTime}
                rudderAngle={rudderAngle}
                isRunning={isAssetLoaded}
                frameIndex={frameIndex}
                globalClockTime={globalClockTime}
                liveData={liveData}
              />
            )) ||
            (dispState === "WIND_VELOCITY" && (
              <WindVelocityGraph
                time={FileTime}
                windVelo={windVelo}
                isRunning={isAssetLoaded}
                frameIndex={frameIndex}
                globalClockTime={globalClockTime}
                liveData={liveData}
              />
            ))
        )}
      </div>
    </div>
  );
};

export default GraphControlPanel;
