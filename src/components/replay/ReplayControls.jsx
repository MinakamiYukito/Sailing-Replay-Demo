import React, { useRef } from 'react';
import { useClock } from '../../contexts/ClockContext'; 

// ReplayControls: buttons and slider for replay control
const ReplayControls = ({ onPlay, onReplay }) => {
  // Get values and functions from global clock context
  const { isPlaying, globalClockTime, setGlobalClockTime, startTime, endTime, setSpeed, speed } = useClock(); 
  // Remember if it was playing before user moves the seek bar
  const wasPlayingRef = useRef(false);

  const handlePlayPause = () => {
    onPlay();
  };
  // Restart replay from beginning
  const handleReplay = () => {
    setGlobalClockTime(startTime); // Reset time to start
    onReplay();
    if (!isPlaying) {
      onPlay();
    }
  };

 // Change time by moving the slider
  const handleSeek = (event) => {
    const newTime = parseFloat(event.target.value);
    setGlobalClockTime(newTime); // Update global time directly, because when moving the slider, the animation is paused
  };

  const handleMouseDown = () => {
    wasPlayingRef.current = isPlaying;
    if (isPlaying) {
      onPlay(); // Pause
    }
  };
  // Resume if it was playing before dragging
  const handleMouseUp = () => {
    if (wasPlayingRef.current) {
      onPlay(); // Resume
    }
  };

  const handleSpeedUp = () => {
    setSpeed((prevSpeed) => (prevSpeed < 8 ? prevSpeed * 2 : prevSpeed));
  };

  const handleSlowDown = () => {
    setSpeed((prevSpeed) => (prevSpeed > 0.125 ? prevSpeed / 2 : prevSpeed));
  };

  // Format number time to mm:ss (scaled by 60)
  const formatTime = (time) => {
    if (typeof time !== 'number' || isNaN(time)) return "0:00";
    const scaledTime = Math.abs(time * 60);
    const minutes = Math.floor(scaledTime / 60);
    const seconds = Math.floor(scaledTime % 60);
    return `${time < 0 ? '-' : ''}${minutes}:${seconds.toString().padStart(2, '0')}`;
  }; 

  return (
    <div className="replay-controls">
      {/* control-buttons */}
      <div className="control-buttons">
        {/* Home button */}
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
      </div>
      {/* --- Seek bar (time slider) --- */}
      <div className="seek-bar-container">
        <span className="time-label">{formatTime(globalClockTime)}</span>
        <input
          type="range"
          min={startTime}
          max={endTime}
          value={globalClockTime} 
          onChange={handleSeek}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          step="0.001"
          className="seek-bar"
        />
        <span className="time-label">{formatTime(endTime)}</span>
      </div>
      
      {/* --- Show current speed --- */}
      <div className="speed-display">
        <span>Speed: {speed}x</span>
      </div>
    </div>
  );
};

export default ReplayControls;