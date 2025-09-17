import React, { useState, useEffect } from 'react';
import { useClock } from '../../contexts/ClockContext'; 
import '../../assets/main.css';

const ReplayControls = ({ onPlay, onReplay, pauseReceiving, resumeReceiving }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const { globalClockTime, setGlobalClockTime, startTime, endTime, setSpeed, speed } = useClock();  

  const handlePlayPause = () => {
    // setIsPlaying((prevState) => !prevState);
    // onPlay(); // Call the external play function
    // if (window.isLiveData) {
    //   if (isPlaying) {
    //     pauseReceiving(); // Pause live data playing
    //   } else {
    //     resumeReceiving(); // Resume live data playing
    //   }
    // }
    setIsPlaying((prevState) => {
      const newState = !prevState;  // This will be the updated play/pause state
  
      // Call the external play function
      // onPlay();
  
      return newState;  // Update the state with the new play/pause state
    });
    onPlay(); // Call the external play function
  };

  const handleReplay = () => {
    setIsPlaying(true); // Set to playing state
    setGlobalClockTime(startTime); // Reset clock to the start
    onReplay(); // Call the external replay function
  };

  const handleSeek = (event) => {
    const newTime = parseFloat(event.target.value);
    if (newTime >= startTime && newTime <= endTime) {
      setGlobalClockTime(newTime); // Update the global clock time
    }
  };

  const handleSpeedUp = () => {
    setSpeed((prevSpeed) => (prevSpeed < 8 ? prevSpeed * 2 : prevSpeed)); // Cap at 8x speed
  };

  const handleSlowDown = () => {
    setSpeed((prevSpeed) => (prevSpeed > 0.125 ? prevSpeed / 2 : prevSpeed)); // Minimum speed is 1/8x
  };

  const formatTime = (time) => {
    const scaledTime = Math.abs(time * 60); // Convert minutes to seconds
    const minutes = Math.floor(scaledTime / 60);
    const seconds = Math.floor(scaledTime % 60);

    return `${time < 0 ? '-' : ''}${minutes}:${seconds.toString().padStart(2, '0')}`;
  }; 


  return (
    <div className="replay-controls">        
      <div className="control-buttons">
        {window.isLiveData ? (
          <div id="player-container">
            {/* <div id="home-container"> */}
              <a href="/" style={{ color: 'white', textDecoration: 'none' }}>
                <i className="fas fa-home"></i>
              </a>
            {/* </div> */}
            {/* <div id="play-pause" className={isPlaying ? "pause" : "play"} onClick={handlePlayPause}>
              <i className={isPlaying ? "fas fa-pause" : "fas fa-play"}></i>
            </div> */}
          </div>
        ) : (
          <>
            <div id="home-container">
              <a href="/" style={{ color: 'white', textDecoration: 'none' }}>
                <i className="fas fa-home"></i>
              </a>
            </div>
            <div id="slow-container">
              <i className="fas fa-backward" onClick={handleSlowDown}></i>
            </div>
            <div id="player-container">
              <div id="play-pause" className={isPlaying ? "pause" : "play"} onClick={handlePlayPause}>
                <i className={isPlaying ? "fas fa-pause" : "fas fa-play"}></i>
              </div>
            </div>
            <div id="fast-container">
              <i className="fas fa-forward" onClick={handleSpeedUp}></i>
            </div>
            <div id="replay-container">
              <i className="fas fa-redo" onClick={handleReplay}></i>
            </div>
          </>
        )}
      </div>

      {!window.isLiveData && (
        <div className="seek-bar-container">
          <span className="time-label">{formatTime(globalClockTime)}</span>
          <input
            type="range"
            min={startTime}
            max={endTime}
            value={globalClockTime}
            onChange={handleSeek}
            step="0.001"
            className="seek-bar"
          />
          <span className="time-label">{formatTime(endTime)}</span>
        </div>
      )}
      
      {!window.isLiveData && (
        <div className="speed-display">
          <span>Speed: {speed}x</span>  {/* Show speed multiplier */}
        </div>
      )}
    </div>
  );
};

export default ReplayControls;
