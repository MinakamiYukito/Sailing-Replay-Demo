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
                <GraphControlPanel
                        //  wrap single values in [] so they become arrays
                    // **核心修正：确保这里是 .map() 来传递所有船的数据**
                    boomAngle={fileData.map(data => data.boomAngle)}
                    fwdVelo={fileData.map(data => data.fwdVelocity)}
                    heelAngle={fileData.map(data => data.heelAngle)}
                    heading={fileData.map(data => data.heading)}
                    hiking={fileData.map(data => data.hikingEffect)}
                    rudderAngle={fileData.map(data => data.rudderAngle)}
                    windVelo={fileData.map(data => data.windVelo)}
                    
                    // **time prop 也必须是包含所有船只时间数组的二维数组**
                    time={fileData.map(data => data.time)}
                    
                    // 其他 props 保持不变
                    globalClockTime={globalClockTime}
                    isAssetLoaded={true}
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