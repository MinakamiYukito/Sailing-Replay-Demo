// src/contexts/ClockContext.jsx

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const ClockContext = createContext();

export const useClock = () => useContext(ClockContext);

export const ClockProvider = ({ children }) => {
  const [globalClockTime, setGlobalClockTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(null);
  const [allData, setAllData] = useState([]);  
  const [speed, setSpeed] = useState(1);
  const [lastReceivedTime, setLastReceivedTime] = useState(null);

  const animationFrameId = useRef();
  const lastFrameTimeRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(speed);
  const endTimeRef = useRef(endTime);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { endTimeRef.current = endTime; }, [endTime]);

  useEffect(() => {
    if (allData.length > 0) {
      const validTimes = allData.map(data => Array.isArray(data.time) ? data.time : []).flat().filter(t => typeof t === 'number' && !isNaN(t));
      if (validTimes.length > 0) {
        const earliestStartTime = Math.min(...validTimes);
        const latestEndTime = Math.max(...validTimes);
        setStartTime(earliestStartTime);
        setEndTime(latestEndTime);
        setGlobalClockTime(earliestStartTime);
      }
    }
  }, [allData]);

  useEffect(() => {
    const animate = (timestamp) => {
      if (!isPlayingRef.current) {
        lastFrameTimeRef.current = null;
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = timestamp;
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }
      
      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;
      
      // 计算出真实流逝的秒数
      const elapsedSeconds = (deltaTime / 1000) * speedRef.current;

      // ======================= 核心修正 START =======================
      // 将流逝的秒数转换为分钟，再加到 prevTime 上
      const timeIncrementInMinutes = elapsedSeconds / 60;
      // ======================= 核心修正 END =========================

      setGlobalClockTime((prevTime) => {
        const newTime = prevTime + timeIncrementInMinutes;
        if (endTimeRef.current !== null && newTime >= endTimeRef.current) {
          setIsPlaying(false);
          return endTimeRef.current;
        }
        return newTime;
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []); 

  useEffect(() => {
    if (lastReceivedTime && isPlaying) {
      setGlobalClockTime(lastReceivedTime);
    }
  }, [lastReceivedTime, isPlaying]);

  const resetClock = () => {
    setGlobalClockTime(startTime);
    setIsPlaying(true);
  };
  
  const updateLastReceivedTime = (time) => {
    setLastReceivedTime(time);
  };
  
  const value = {
    globalClockTime, setGlobalClockTime, setIsPlaying, setAllData, 
    resetClock, isPlaying, startTime, endTime, setSpeed, speed,
    updateLastReceivedTime
  };

  return (
    <ClockContext.Provider value={value}>
      {children}
    </ClockContext.Provider>
  );
};