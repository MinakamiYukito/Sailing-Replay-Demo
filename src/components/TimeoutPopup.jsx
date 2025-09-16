import React, { useState, useEffect } from 'react';

const TimeoutPopup = ({ dataTimeout, handleDataTimeout }) => {
  // const handleClose = () => {
  //   setDataTimeout(false);  // Close the popup and reset the state
  // };

  return (
    <>
      <style>
          {`
            .popup {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              display: none;
              justify-content: center;
              align-items: center;
              background-color: rgba(0, 0, 0, 0.5);
              z-index: 1000;
            }

            .popup.visible {
              display: flex;
            }

            .popup-content {
              background-color: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              text-align: center;
            }

            button {
              margin-top: 20px;
            }
          `}
        </style>
      <div className={`popup ${dataTimeout ? 'visible' : 'hidden'}`}>
        <div className="popup-content">
          <h2>Data Receive Timeout</h2>
          <p>No data has been received within the expected timeframe. Please check the connection.</p>
          <button onClick={handleDataTimeout}>Close</button>
        </div>
      </div>
    </>
  );
};

export default TimeoutPopup;