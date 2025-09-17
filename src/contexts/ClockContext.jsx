import React, { createContext, useContext, useState, useEffect } from 'react';

const ClockContext = createContext();

export const useClock = () => useContext(ClockContext);

export const ClockProvider = ({ children }) => {
  const [globalClockTime, setGlobalClockTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(null);
  const [allData, setAllData] = useState([]);  
  const [speed, setSpeed] = useState(1);
  const [lastReceivedTime, setLastReceivedTime] = useState(null);  // Store last received time

  useEffect(() => {
    if (allData.length > 0) {
      const earliestStartTime = Math.min(...allData.map(data => data.time[1]));
      const latestEndTime = Math.max(...allData.map(data => Math.max(...data.time.filter(Boolean))));
      setStartTime(earliestStartTime);
      setEndTime(latestEndTime); // Set the latest end time
      setGlobalClockTime(earliestStartTime); // Initialize globalClockTime
    }
  }, [allData]);

  useEffect(() => {
    if (isPlaying && globalClockTime >= startTime && (endTime === null || globalClockTime <= endTime)) {
      const interval = setInterval(() => {
        setGlobalClockTime((prevTime) => prevTime + 0.001 * speed);
      }, 10);
      return () => clearInterval(interval);
    }
    if (globalClockTime >= endTime) {
      setIsPlaying(false); // Stop the clock when it reaches the end time
    }
  }, [isPlaying, startTime, globalClockTime, endTime, speed]);

  // Update global clock when new data arrives (i.e., live data mode)
  useEffect(() => {
    if (lastReceivedTime && isPlaying) {
      setGlobalClockTime(lastReceivedTime);  // Update to the latest time received
    }
  }, [lastReceivedTime, isPlaying]);

  const resetClock = () => {
    setGlobalClockTime(startTime); // Reset the clock to the start time
    setIsPlaying(true); // Start playing the clock
  };

  // Function to set last received time from WebSocket
  const updateLastReceivedTime = (time) => {
    setLastReceivedTime(time);
  }    

  return (
    <ClockContext.Provider 
      value={{ 
        globalClockTime, 
        setGlobalClockTime, 
        setIsPlaying, 
        setAllData, 
        resetClock, 
        isPlaying, 
        startTime, 
        endTime, 
        setSpeed, 
        speed,
        updateLastReceivedTime // Expose this function
      }}>
      {children}
    </ClockContext.Provider>
  );
};
