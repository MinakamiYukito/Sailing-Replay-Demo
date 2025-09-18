import React, { useRef, useState } from "react";
import ReplayPage from "./pages/ReplayPage/ReplayPage.jsx";
import ReplayControls from "./components/replay/ReplayControls.jsx";
import Map from "./components/replay/Map.jsx";
import GraphControlPanel from "./components/graphs/GraphControlPanel.jsx";
import LandingPage from "./pages/LandingPage/LandingPage.jsx";
import { ClockProvider, useClock } from "./contexts/ClockContext.jsx";
import "./assets/main.css";

// Main content of the app

const AppContent = () => {
    const renderContainerRef = useRef(null);
    const [fileData, setFileData] = useState(null);
    const { isPlaying, setIsPlaying, setAllData, globalClockTime } = useClock();

    // Handle new replay data when uploaded
    const handleDataReceived = (newData) => {
        if (newData && newData.length > 0) {
            setFileData(newData);
            setAllData(newData);
            setIsPlaying(true);
        } else {
            console.error("Cannot replay: empty or incorrect data format.");
        }
    };
    // Play or pause toggle
    const handlePlay = () => setIsPlaying(prev => !prev);

    const handleReplay = () => setFileData(null); 

    // If no data yet, show landing page
    if (!fileData) {
        return <LandingPage onDataReceived={handleDataReceived} />;
    }
    
    // Make sure first boat data exists, avoid crash on first render

    const firstBoatData = fileData[0]; 

    return (
        <div className="container">
            <div className="upper-half">
                <div id="render-wrapper" ref={renderContainerRef}>
                    <ReplayPage
                        allData={fileData}
                        containerRef={renderContainerRef}
                    />
                    <div className="replay-control-wrapper">
                      <ReplayControls 
                          onPlay={handlePlay} 
                          onReplay={handleReplay}
                      />
                    </div>
                </div>
                <div id="map-wrapper">
                    <Map allData={fileData} />
                </div>
            </div>
            <div className="lower-half">
                {/* Render graphs only if boat data exists */}
                {firstBoatData && (
                    <GraphControlPanel
                        //  wrap single values in [] so they become arrays
                        boomAngle={[firstBoatData.boomAngle]}
                        fwdVelo={[firstBoatData.fwdVelocity]}
                        heelAngle={[firstBoatData.heelAngle]}
                        heading={[firstBoatData.heading]}
                        hiking={[firstBoatData.hikingEffect]}
                        rudderAngle={[firstBoatData.rudderAngle]}
                        time={firstBoatData.time} // Time is shared, keep as one array
                        windVelo={[firstBoatData.windVelo]}
                        
                        globalClockTime={globalClockTime}
                        isAssetLoaded={true}
                    />
                )}
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