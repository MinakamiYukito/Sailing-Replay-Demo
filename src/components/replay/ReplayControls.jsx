import React, { useState } from 'react';
import { useClock } from '../../contexts/ClockContext'; 
import '../../assets/main.css';

const ReplayControls = ({ onPlay, onReplay }) => {
  const { isPlaying, globalClockTime, setGlobalClockTime, startTime, endTime, setSpeed, speed } = useClock(); 

  const handlePlayPause = () => {

    onPlay();
  };

  const handleReplay = () => {
    setGlobalClockTime(startTime);
    onReplay();
    if (!isPlaying) {
      onPlay();
    }
  };

  const handleSeek = (event) => {
    const newTime = parseFloat(event.target.value);
    if (newTime >= startTime && newTime <= endTime) {
      setGlobalClockTime(newTime);
    }
  };

  const handleSpeedUp = () => {
    setSpeed((prevSpeed) => (prevSpeed < 8 ? prevSpeed * 2 : prevSpeed));
  };

  const handleSlowDown = () => {
    setSpeed((prevSpeed) => (prevSpeed > 0.125 ? prevSpeed / 2 : prevSpeed));
  };

  const formatTime = (time) => {
    const scaledTime = Math.abs(time * 60);
    const minutes = Math.floor(scaledTime / 60);
    const seconds = Math.floor(scaledTime % 60);

    return `${time < 0 ? '-' : ''}${minutes}:${seconds.toString().padStart(2, '0')}`;
  }; 

  return (
    <div className="replay-controls">
      <div className="control-buttons">
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
      
      <div className="speed-display">
        <span>Speed: {speed}x</span>
      </div>
    </div>
  );
};

export default ReplayControls;