import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const ClockContext = createContext();
export const useClock = () => useContext(ClockContext);

export const ClockProvider = ({ children }) => {
  const [globalClockTime, setGlobalClockTime] = useState(0);   // current time (minutes)
  const [isPlaying, setIsPlaying] = useState(false);           // playing or paused
  const [startTime, setStartTime] = useState(0);               // start time (minutes)
  const [endTime, setEndTime] = useState(null);                // end time (minutes)
  const [allData, setAllData] = useState([]);                  // external data, used to compute start/end
  const [speed, setSpeed] = useState(1);                       // playback speed (1x, 2x, ...)
  const [lastReceivedTime, setLastReceivedTime] = useState(null); // external latest time (jump target)

  // Refs for animation loop (always fresh values)
  const animationFrameId = useRef();
  const lastFrameTimeRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(speed);
  const endTimeRef = useRef(endTime);

  // keep refs in sync with latest states
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { endTimeRef.current = endTime; }, [endTime]);

  // Expect each item in allData has a "time" array (numbers).
  useEffect(() => {
    if (allData.length > 0) {
      const validTimes = allData
        .map(d => Array.isArray(d.time) ? d.time : [])
        .flat()
        .filter(t => typeof t === 'number' && !isNaN(t));

      if (validTimes.length > 0) {
        const earliest = Math.min(...validTimes);
        const latest = Math.max(...validTimes);
        setStartTime(earliest);
        setEndTime(latest);
        setGlobalClockTime(earliest); // reset to start
      }
    }
  }, [allData]);

  useEffect(() => {
    const animate = (timestamp) => {
      // if paused, keep looping but do not advance time
      if (!isPlayingRef.current) {
        lastFrameTimeRef.current = null;
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }

      // first frame: just init timestamp baseline
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = timestamp;
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }

      // delta in ms between frames
      const deltaMs = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      // real elapsed seconds * speed
      const elapsedSeconds = (deltaMs / 1000) * speedRef.current;

      // IMPORTANT: convert seconds -> minutes (globalClockTime uses minutes)
      const timeIncrementInMinutes = elapsedSeconds / 60;

      // update global time, stop at endTime
      setGlobalClockTime((prev) => {
        const next = prev + timeIncrementInMinutes;
        if (endTimeRef.current !== null && next >= endTimeRef.current) {
          setIsPlaying(false);              // stop at the end
          return endTimeRef.current;
        }
        return next;
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    // start loop
    animationFrameId.current = requestAnimationFrame(animate);

    // cleanup on unmount
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []); // run once

  // ===== If we received an external time while playing, jump to it =====
  useEffect(() => {
    if (lastReceivedTime && isPlaying) {
      setGlobalClockTime(lastReceivedTime);
    }
  }, [lastReceivedTime, isPlaying]);

  // ===== Public helpers =====
  const resetClock = () => {
    setGlobalClockTime(startTime);
    setIsPlaying(true);
  };

  const updateLastReceivedTime = (time) => {
    setLastReceivedTime(time);
  };

  // ===== Expose context value =====
  const value = {
    globalClockTime, setGlobalClockTime,
    isPlaying, setIsPlaying,
    startTime, endTime,
    speed, setSpeed,
    setAllData,
    resetClock,
    updateLastReceivedTime,
  };

  return (
    <ClockContext.Provider value={value}>
      {children}
    </ClockContext.Provider>
  );
};
