import React, { useState, useRef, useEffect } from 'react';
import { useClock } from '../../contexts/ClockContext'; 

// ReplayControls: UI for play, pause, seek bar, replay, speed control
const ReplayControls = ({ onPlay, onReplay }) => {
  const { isPlaying, globalClockTime, setGlobalClockTime, startTime, endTime, setSpeed, speed } = useClock(); 
  
  // Local state for slider (make slider move smooth during drag)
  const [localSeekValue, setLocalSeekValue] = useState(null); 
  
  // Remember if it was playing before drag
  const wasPlayingRef = useRef(false);

  // Show slider value: use local value if dragging, else use global time
  const displayTime = localSeekValue !== null ? localSeekValue : globalClockTime;

  // Sync local slider with global time when not dragging
  useEffect(() => {
    if (localSeekValue === null) {
      // keep slider in sync with playback
    }
  }, [globalClockTime, localSeekValue]);

  // Play / Pause toggle
  const handlePlayPause = () => {
    onPlay();
  };

  // Restart from beginning
  const handleReplay = () => {
    setGlobalClockTime(startTime);
    onReplay();
    if (!isPlaying) {
      onPlay();
    }
  };

  // When slider is moving
  const handleSeek = (event) => {
    const newTime = parseFloat(event.target.value);
    setLocalSeekValue(newTime);     // update slider
    setGlobalClockTime(newTime);    // update global clock
  };

  // When user clicks on slider (mouse down)
  const handleMouseDown = () => {
    wasPlayingRef.current = isPlaying;
    if (isPlaying) {
      onPlay(); // pause
    }
    setLocalSeekValue(globalClockTime);
  };

  // When user releases slider (mouse up)
  const handleMouseUp = () => {
    setLocalSeekValue(null); 
    if (wasPlayingRef.current) {
      onPlay(); // play again if it was playing
    }
  };

  // Speed up (max 8x)
  const handleSpeedUp = () => {
    setSpeed((prevSpeed) => (prevSpeed < 8 ? prevSpeed * 2 : prevSpeed));
  };

  // Slow down (min 0.125x)
  const handleSlowDown = () => {
    setSpeed((prevSpeed) => (prevSpeed > 0.125 ? prevSpeed / 2 : prevSpeed));
  };

  // Format time to "minutes:seconds"
  const formatTime = (time) => {
    if (typeof time !== 'number' || isNaN(time)) return "0:00";
    const scaledTime = Math.abs(time * 60);
    const minutes = Math.floor(scaledTime / 60);
    const seconds = Math.floor(scaledTime % 60);
    return `${time < 0 ? '-' : ''}${minutes}:${seconds.toString().padStart(2, '0')}`;
  }; 

  return (
    <div className="replay-controls">
      {/* Buttons: home, slow, play/pause, fast, replay */}
      <div className="control-buttons">
        <div id="home-container"><a href="/" style={{ color: 'white', textDecoration: 'none' }}><i className="fas fa-home"></i></a></div>
        <div id="slow-container"><i className="fas fa-backward" onClick={handleSlowDown}></i></div>
        <div id="player-container"><div id="play-pause" className={isPlaying ? "pause" : "play"} onClick={handlePlayPause}><i className={isPlaying ? "fas fa-pause" : "fas fa-play"}></i></div></div>
        <div id="fast-container"><i className="fas fa-forward" onClick={handleSpeedUp}></i></div>
        <div id="replay-container"><i className="fas fa-redo" onClick={handleReplay}></i></div>
      </div>

      {/* Seek bar with current time and end time */}
      <div className="seek-bar-container">
        <span className="time-label">{formatTime(displayTime)}</span>
        <input
          type="range"
          min={startTime}
          max={endTime}
          value={displayTime}
          onChange={handleSeek}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          step="0.001"
          className="seek-bar"
        />
        <span className="time-label">{formatTime(endTime)}</span>
      </div>
      
      {/* Speed display */}
      <div className="speed-display">
        <span>Speed: {speed}x</span>
      </div>
    </div>
  );
};

export default ReplayControls; 
