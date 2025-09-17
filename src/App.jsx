import React, { useRef, useState } from "react";
import Replay from "./components/replay/Replay";
import ReplayControls from "./components/replay/ReplayControls.jsx";
import "./assets/main.css";
import Map from "./components/replay/Map.jsx";
import GraphControlPanel from "./components/graphs/GraphControlPanel.jsx";
import Landing from "./components/Landing.jsx";
import { ClockProvider, useClock } from "./contexts/ClockContext.jsx";

const AppContent = () => {
  const canvasRef = useRef(null);
  const upperHalfRef = useRef(null);
  const mapRef = useRef(null);
  const graphRef = useRef(null);
  const [fileData, setFileData] = useState(null);
  const { isPlaying, setIsPlaying, setAllData, globalClockTime } = useClock();

  const handleDataReceived = (newData) => {
    console.log("handleDataReceived success", newData);
    
    if (newData && newData.length > 0) {
      setFileData(newData);
      setAllData(newData);
      setIsPlaying(true);
      console.log("State updated");
    } else {
      console.error("cannot replay because of empty or incorrect format data ");
    }
  };

  const handlePlay = () => setIsPlaying(prev => !prev);
  const handleReplay = () => setFileData(null);

  if (!fileData) {
    return <Landing onDataReceived={handleDataReceived} />;
  } 
  
  return (
    <div className="container">
        <div className="upper_half" ref={upperHalfRef}>
          <div id="render" ref={canvasRef}>
            <Replay
              allData={fileData}
              canvasRef={canvasRef}
              mapRef={mapRef}
              upperHalfRef={upperHalfRef}
              isPlaying={isPlaying}
            />
          </div>
        </div>
        <div className="replay-control">
          <ReplayControls 
            onPlay={handlePlay} 
            onReplay={handleReplay}
          />
        </div>
        <div id="map" ref={mapRef}>
          <Map allData={fileData} />
        </div>
        <div className="lower_half" ref={graphRef}>
          <GraphControlPanel
            boomAngle={fileData.map(data => data.boomAngle)}
            fwdVelo={fileData.map(data => data.fwdVelocity)}
            heelAngle={fileData.map(data => data.heelAngle)}
            heading={fileData.map(data => data.heading)}
            hiking={fileData.map(data => data.hikingEffect)}
            rudderAngle={fileData.map(data => data.rudderAngle)}
            time={fileData.map(data => data.time)}
            X_Position={fileData.map(data => data.X_Position)}
            Y_Position={fileData.map(data => data.Y_Position)}
            headingRadians={fileData.map(data => data.headingRadians)}
            windVelo={fileData.map(data => data.windVelo)}
            allData={fileData}
            globalClockTime={globalClockTime}
          />
        </div>
      </div>
  );
};

const App = () => (
  <ClockProvider>
    <AppContent />
  </ClockProvider>
);

export default App;