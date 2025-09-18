import React, { useEffect, useRef, useState } from "react";
import { useClock } from "../../contexts/ClockContext.jsx";
import * as sceneManager from '../../three/sceneManager.js';
import { detectDeviceCapabilities } from '../../utils/replayUtils.js';

// Small component to show boat name when selected
const BoatInfo = ({ boatName }) => {
    return (
        <div>
            <p><strong>Boat:</strong> {boatName}</p>
        </div>
    );
};

// Main replay page
const ReplayPage = ({ allData, containerRef }) => {
    // Decide graphics mode (high or low) based on device performance
    const [graphicsMode] = useState(detectDeviceCapabilities());

    // Get current global time from clock context
    const { globalClockTime } = useClock();

    // Which boat is selected (by user click)
    const [selectedBoat, setSelectedBoat] = useState(null);

    // Keep a ref of the global time, so Three.js scene can read it
    const clockTimeRef = useRef(globalClockTime);

    // Update ref whenever globalClockTime changes
    useEffect(() => {
        clockTimeRef.current = globalClockTime;
    }, [globalClockTime]);

    // Setup 3D scene when component loads or data changes
    useEffect(() => {
        if (containerRef.current && allData.length > 0) {
            // Callbacks for user interaction in the scene
            const interactionCallbacks = {
                onBoatSelect: (boatName) => setSelectedBoat(boatName),
                onBoatDeselect: () => setSelectedBoat(null),
            };

            sceneManager.setupScene({
                containerRef, // pass container reference directly
                allData, 
                graphicsMode,
                clockTimeRef,
                interactionCallbacks,
            });
        }
        
        // Cleanup scene when component unmounts
        return () => {
            sceneManager.cleanup();
        };
    }, [allData, graphicsMode, containerRef]);

    // Show boat info box if a boat is selected
    return (
        <div className={`boat-info-container ${selectedBoat ? 'visible' : ''}`}>
            {selectedBoat && <BoatInfo boatName={selectedBoat} />}
        </div>
    );
};

export default ReplayPage;