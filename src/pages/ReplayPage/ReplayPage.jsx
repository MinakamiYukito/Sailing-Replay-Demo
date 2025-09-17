import React, { useEffect, useRef, useState } from "react";
import "./replay.css";
import { useClock } from "../../contexts/ClockContext.jsx";
import * as sceneManager from '../../three/sceneManager.js';
import { detectDeviceCapabilities } from '../../utils/replayUtils.js';

const BoatInfo = ({ boatName }) => {
    return (
        <div>
          <p>Boat Name: {boatName}</p>
        </div>
    );
};

const ReplayPage = ({ allData, canvasRef, upperHalfRef, mapRef }) => {
    const [graphicsMode] = useState(detectDeviceCapabilities());
    const { globalClockTime } = useClock();
    const [selectedBoat, setSelectedBoat] = useState(null);
    const clockTimeRef = useRef(globalClockTime);

    useEffect(() => {
        clockTimeRef.current = globalClockTime;
    }, [globalClockTime]);

    useEffect(() => {
        if (upperHalfRef.current && canvasRef.current && mapRef.current && allData.length > 0) {
            
            const interactionCallbacks = {
                onBoatSelect: (boatName) => setSelectedBoat(boatName),
                onBoatDeselect: () => setSelectedBoat(null),
            };

            sceneManager.setupScene({
                canvasRef, 
                mapRef, 
                upperHalfRef, 
                allData, 
                graphicsMode,
                clockTimeRef,
                interactionCallbacks,
            });
        }

        return () => {
            sceneManager.cleanup();
        };

    }, [allData, graphicsMode, upperHalfRef, canvasRef, mapRef]);

    return (
        <div>
            <div
                id="boat-info-container"
                style={{
                    display: selectedBoat ? "block" : "none",
                    position: "fixed",
                    top: "10px",
                    right: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    border: "1px solid #ccc",
                    padding: "10px",
                    borderRadius: "5px",
                    zIndex: 1000,
                }}
            >
                {selectedBoat && <BoatInfo boatName={selectedBoat} />}
            </div>
        </div>
    );
};

export default ReplayPage;