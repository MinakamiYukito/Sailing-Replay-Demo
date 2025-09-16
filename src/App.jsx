import React, { useRef, useState, useEffect } from "react";
import Replay from "./components/replay/Replay";
import ReplayControls from "./components/replay-control/ReplayControls.jsx";
import "../src/main.css";
import Map from "./components/Map";
import GraphControlPanel from "./components/replay/graphs/GraphControlPanel";
import Landing from "./components/Landing.jsx";
import { ClockProvider, useClock } from "./components/ClockContext";
import { useWebSocket } from "./useWebSocket.jsx";
import  BoatStreamingManager from "./components/BoatStreamingManager.jsx";
import TimeoutPopup from "./components/TimeoutPopup.jsx";

const App = () => {
  const canvasRef = useRef(null);
  const upperHalfRef = useRef(null);
  const mapRef = useRef(null);
  const graphRef = useRef(null);
  const [isAssetLoaded, setAssetLoaded] = useState(false);
  const [fileData, setFileData] = useState([]);
  const [liveBoatsData, setLiveBoatsData] = useState([]);
  const [isLiveDataMode, setIsLiveDataMode] = useState(false);
  const [isReplayStarted, setReplayStarted] = useState(false);  
  
  const { isConnected, data: liveData, pauseReceiving, resumeReceiving, sendMessage, connectWebSocket, lastReceivedTime, dataTimeout, setDataTimeout, graphData } = useWebSocket("ws://localhost:8080", 10000);

  
  const handleAssetLoaded = (loaded) => {
    setAssetLoaded(loaded);
  };

  const handleDataReceived = (newData, isLiveData) => {
    console.log("Received data:", newData, "Is live data:", isLiveData, "AssetLoaded status:", isAssetLoaded);
    if (isLiveData) {
      // If it's live data, append it to the liveBoatsData state
      // setLiveBoatsData(prevBoats => [...prevBoats, ...newData]);
      setLiveBoatsData(newData);
      setIsLiveDataMode(true);           
      console.log("Live data streaming event triggered");      
    } else {
      // If it's file upload data, append it to the fileData state
      setFileData(newData);
      setIsLiveDataMode(false);
      setAssetLoaded(true);
      setReplayStarted(true); // Automatically transition to replay for file data
      console.log("File data upload event triggered");
    }   
  }; 

  useEffect(() => {
    if (isConnected && liveData.length !== 0) {
      console.log("Live Data received:", liveData);      
      handleDataReceived(liveData, true);
    }
  }, [liveData, isConnected]);  

  return (
      <ClockProvider>
        <ClockContent
          isAssetLoaded={isAssetLoaded}
          setAssetLoaded={setAssetLoaded}
          handleDataReceived={handleDataReceived}
          handleAssetLoaded={handleAssetLoaded}
          fileData={fileData}
          canvasRef={canvasRef}
          upperHalfRef={upperHalfRef}
          mapRef={mapRef}
          graphRef={graphRef}
          liveData={liveData} // Pass live data to ClockContent
          isConnected={isConnected} // Pass connection status
          isLiveDataMode={isLiveDataMode} // Pass isLiveDataMode to ClockContent
          liveBoatsData={liveBoatsData} // Pass liveBoatsData to ClockContent
          isReplayStarted={isReplayStarted}
          pauseReceiving={pauseReceiving} 
          resumeReceiving={resumeReceiving}
          sendMessage={sendMessage}
          connectWebSocket={connectWebSocket}
          lastReceivedTime={lastReceivedTime}
          dataTimeout={dataTimeout}
          setDataTimeout={setDataTimeout}                   
        />
      </ClockProvider>
  );
};

const ClockContent = ({
  isAssetLoaded,
  setAssetLoaded,
  handleDataReceived,
  handleAssetLoaded,
  fileData,
  canvasRef,
  upperHalfRef,
  mapRef,
  graphRef,
  liveData, // Receive live data
  isConnected, // Receive connection status
  isLiveDataMode, // Receive isLiveDataMode from props
  liveBoatsData,  // Receive liveBoatsData from props
  isReplayStarted,
  pauseReceiving,
  resumeReceiving,
  sendMessage,
  connectWebSocket,
  lastReceivedTime,
  dataTimeout,
  setDataTimeout,
}) => {
  const { isPlaying, setIsPlaying, setAllData, setGlobalClockTime } = useClock();
  const { globalClockTime } = useClock();
  const { updateLastReceivedTime } = useClock();

  const handlePlay = () => {
    // setIsPlaying((prevIsPlaying) => !prevIsPlaying);
    setIsPlaying((prevIsPlaying) => {
      const newIsPlaying = !prevIsPlaying; // Determine the new play state
  
      // Handle live data streaming
      if (window.isLiveData) {
        if (newIsPlaying) {
          resumeReceiving(); // Resume live data when playing
        } else {
          pauseReceiving(); // Pause live data when paused
        }
      }
  
      // Additional logic for local file upload (if needed)
      // You can call your onPlay logic for file uploads here if necessary
  
      return newIsPlaying; // Update the play state
    });

  };

  const handleReplay = () => {
    setAssetLoaded(false);
    setTimeout(() => {
      setAssetLoaded(true);
    }, 0);
  };

  // Manually trigger live data mode replay
  const handleLiveDataReplay = () => {
    if (isLiveDataMode && liveBoatsData.length > 0 && !isAssetLoaded) {
      setAssetLoaded(true);  // Trigger the replay page rendering
    } 
  };

  let isBoatAdded = false;
  
  // Function to handle adding the boat via WebSocket
  const handleAddBoat = ({ boatID, filePath }) => {
    console.log('Boat added:', boatID, filePath);
    // Send the boat data to the WebSocket server to start the internal clock and parse data
    sendMessage(JSON.stringify({
      type: 'add-boat',
      data: { boatID, filePath }
    }));
    isBoatAdded = true;
  };

  const handleDataTimeout = () => {
    setDataTimeout(false);  // Close the popup and reset the state
  };

  useEffect(() => {
    if (fileData.length > 0) {
      setAllData(fileData);
    }
  }, [fileData, setAllData]);

  // Ensure live data gets replayed properly
  useEffect(() => {
    if (isLiveDataMode && liveBoatsData.length > 0) {
      setAllData(liveBoatsData);      
    }
  }, [liveBoatsData, isLiveDataMode, setAllData]);

  // Simulate data reception, live or from file
  useEffect(() => {
    if (liveData.length > 0 || fileData.length > 0) {
      setIsPlaying(true); // Automatically start playing when data is available
    }
  }, [liveData, fileData]);

  useEffect(() => {
    // When new data arrives, update the clock to sync with the latest data
    if (lastReceivedTime) {
      updateLastReceivedTime(lastReceivedTime);  // Sync the clock with the latest time from WebSocket
    }
  }, [lastReceivedTime, updateLastReceivedTime]);  

  // Render logic for file replay vs. live data replay
  if (isAssetLoaded) {
    if (isLiveDataMode && liveBoatsData.length > 0) {
      console.log("live data streaming replay triggered");
      // Render live data stream replay
      return (
        <div className="container">
          <div className="upper_half" ref={upperHalfRef}>
            <div id="render" ref={canvasRef}>
              <Replay
                allData={liveBoatsData}
                canvasRef={canvasRef}
                mapRef={mapRef}
                upperHalfRef={upperHalfRef}
                lastReceivedTime={lastReceivedTime}
                isPlaying={isPlaying}
                dataTimeout={dataTimeout}
                setDataTimeout={handleDataTimeout}
              />
            </div>
          </div>
          <div className="replay-control">
            <ReplayControls 
              onPlay={handlePlay} 
              onReplay={handleLiveDataReplay} 
              pauseReceiving={pauseReceiving} 
              resumeReceiving={resumeReceiving}
            />
          </div>
          <div id="map" ref={mapRef}>
            <Map allData={liveBoatsData} />
          </div>
          <div className="lower_half" ref={graphRef}>
            <GraphControlPanel
              boomAngle={liveBoatsData.map(data => data.boomAngle)}
              fwdVelo={liveBoatsData.map(data => data.fwdVelocity)}
              heelAngle={liveBoatsData.map(data => data.heelAngle)}
              heading={liveBoatsData.map(data => data.heading)}
              hiking={liveBoatsData.map(data => data.hikingEffect)}
              rudderAngle={liveBoatsData.map(data => data.rudderAngle)}
              time={liveBoatsData.map(data => data.time)}
              X_Position={liveBoatsData.map(data => data.X_Position)}
              Y_Position={liveBoatsData.map(data => data.Y_Position)}
              headingRadians={liveBoatsData.map(data => data.headingRadians)}
              windVelo={liveBoatsData.map(data => data.windVelo)}
              isAssetLoaded={isAssetLoaded}
              allData={liveBoatsData}
              globalClockTime={globalClockTime}
            />
          </div>
          {/* <BoatStreamingManager onAddBoat={handleAddBoat} /> */}
          {dataTimeout && <TimeoutPopup dataTimeout={dataTimeout} handleDataTimeout={handleDataTimeout} />}
        </div>
      );
    } else if (isReplayStarted && fileData.length > 0) {
      console.log("file data upload replay triggered");
      // Render file upload replay
      return (
        <div className="container">
          <div className="upper_half" ref={upperHalfRef}>
            <div id="render" ref={canvasRef}>
              <Replay
                allData={fileData}
                canvasRef={canvasRef}
                mapRef={mapRef}
                upperHalfRef={upperHalfRef}
              />
            </div>
          </div>
          <div className="replay-control">
            <ReplayControls 
              onPlay={handlePlay} 
              onReplay={handleReplay}
              pauseReceiving={pauseReceiving} 
              resumeReceiving={resumeReceiving} 
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
              isAssetLoaded={isAssetLoaded}
              allData={fileData}
              globalClockTime={globalClockTime}
            />
          </div>
        </div>
      );
    }
  }

  return (
    <Landing 
      onDataReceived={handleDataReceived}
      onAssetLoaded={handleAssetLoaded}
      liveData={liveData} 
      isConnected={isConnected}
      sendMessage={sendMessage}
      connectWebSocket={connectWebSocket}
    />
  );

};

export default App;