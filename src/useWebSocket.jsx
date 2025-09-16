import { useState, useEffect, useRef } from 'react';

export const useWebSocket = (url, timeoutDuration) => {
  const [data, setData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);  // Track if the connection is paused  
  const [lastReceivedTime, setLastReceivedTime] = useState(null);  // Track the last received time for live data
  const [reconnectInterval, setReconnectInterval] = useState(null); // Store the reconnect interval
  const [dataTimeout, setDataTimeout] = useState(false); // Track if timeout happened
  const [popupShown, setPopupShown] = useState(false); // Track if the pop-up has been shown  
  const wsRef = useRef(null); // Store the WebSocket instance across renders
  const timeoutRef = useRef(null); // Reference to the timeout
  
  // Function to pause playing data
  const pauseReceiving = () => {
    setIsPaused(true);
  };

  // Function to resume playing data
  const resumeReceiving = () => {
    setIsPaused(false);    
  };

  // WebSocket message sending function
  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    } else {
      console.log('WebSocket is not open, message not sent:', message);
    }
  };
  
  const connectWebSocket = () => {
    // Only create a new WebSocket if one does not already exist
    if (!wsRef.current) {
      const ws = new WebSocket(url);
      wsRef.current = ws; // Store WebSocket instance

      ws.onopen = () => {
        console.log('Connected to WebSocket server');
        setIsConnected(true);
        setDataTimeout(false); // Reset the timeout state
        setPopupShown(false); // Reset the popup state
        if (reconnectInterval) {
          clearInterval(reconnectInterval); // Stop trying to reconnect once connected
        }
      };

      ws.onmessage = (event) => {
        
        try {
          // const parsedData = JSON.parse(event.data);
          const message = JSON.parse(event.data);          

          if (message.type === 'boatData') {
            const receivedData = message.data;
            // setData((prevData) => [...prevData, ...receivedData]);
            setData(receivedData);
            console.log('WebSocket Server Data received:', receivedData);
          }

          if (message.type === 'clock') {
            setLastReceivedTime(message.time);
            // console.log('WebSocket Server Time received:', message.time);
          }        
          
        } catch (error) {
          console.error('Error parsing data:', error);
        }
        setDataTimeout(false);
        // Reset the timeout every time data is received
        // clearTimeout(timeoutRef.current);
        // timeoutRef.current = setTimeout(() => {
        //   setDataTimeout(false);
        // }, timeoutDuration);
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setIsConnected(false);        
        // Prevent further reconnection attempts after pop-up is shown
        if (popupShown) {
          // Clear the reconnection interval if the pop-up is already shown
          if (reconnectInterval) {
            clearInterval(reconnectInterval);
          }
          return;  // Don't reconnect anymore after pop-up is shown
        }

        // Show pop-up only once
        if (!popupShown) {
          setDataTimeout(true); // Show the pop-up
          setPopupShown(true);  // Ensure the pop-up is only shown once
        }

        // Attempt reconnection only if the pop-up hasn't been shown yet
        if (!reconnectInterval && !popupShown) {
          setReconnectInterval(setInterval(connectWebSocket, 2000)); // Retry every 2 seconds
        }
        wsRef.current = null; // Reset the reference when WebSocket closes
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close(); // Close on error
      };
    }
    // const handleWebSocketStop = () => {
    //   setDataTimeout(true); // Trigger the timeout UI or alert
    //   clearTimeout(timeoutRef.current); // Ensure no duplicate timeout triggers
    // };    

    // Cleanup function to close WebSocket on component unmount or URL change
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
        // clearTimeout(timeoutRef.current);
        console.log('WebSocket connection closed during cleanup');
      }
    };
  };

  useEffect(() => {    
    connectWebSocket();
  }, []);

  return { data, isConnected, pauseReceiving, resumeReceiving, sendMessage, lastReceivedTime, dataTimeout, setDataTimeout };
};