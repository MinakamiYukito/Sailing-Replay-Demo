// Custom hook to handle WebSocket connection
import { useState, useEffect } from 'react';

export const useWebSocket = (url) => {
    const [data, setData] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [timeAndXY, setTimeAndXY] = useState({
      time: [],
      X_Position: [],
      Y_Position: [],
      headingRadians: []
    });
  
    useEffect(() => {
      const ws = new WebSocket(url);
  
      ws.onopen = () => {
        console.log('Connected to WebSocket server');
        setIsConnected(true);
      };
  
      ws.onmessage = (event) => {
        try {
            const parsedData = parseSBPData(event.data);
            setData(prevData => [...prevData, ...parsedData]);
            console.log('Web Socket Server Data received:', parsedData);             
            
          } catch (error) {
            console.error('Error parsing data:', error);
          }
      };
  
      ws.onclose = () => {
        console.log('Disconnected from WebSocket server');
        setIsConnected(false);
      };
  
      return () => {
        ws.close();
      };
    }, [url]);

    const parseSBPData = (data) => {
        // Implement the logic to parse SBP data and convert it into the format your components expect
        const lines = data.split('\n');
        const updatedFileData = [];
    
        const metadata = lines[0].split('\t');
        const courseData = `${metadata[4]},${metadata[5]}`;
        
        const time = []; // Array to store column 0 data
        const X_Position=[];
        const Y_Position=[];
        const headingRadians=[];
        const fwdVelocity = []; // Array to store fwd_velocity data
        const hikingEffect = []; // Array to store hiking_effect data
        const boomAngle = []; // Array to store boomAngle data
        const heelAngle = []; // Array to store heelAngle data
        const heading = []; // Array to store heading data
        const rudderAngle = []; // Array to store rudderAngle data
        const windVelo = []; // Array to store windVelo data

        for (let i = 1; i < lines.length; i++) {
          const columns = lines[i].split('\t');
          const column0Value = parseFloat(columns[0]) / 60;
          const xval=parseFloat(columns[1]);
          const yval=parseFloat(columns[2]);
          const hr=((parseFloat(columns[6]) *180) / Math.PI) * (Math.PI / 180);
          const fwdVelValue = parseFloat(columns[11]) / -0.51444;
          const hikingEffectValue = parseFloat(columns[14]);
          const boomAngleValue = parseFloat(((columns[7])*180) / Math.PI);
          const heelAngleValue = parseFloat(((columns[4])*180) / Math.PI);
          const headingValue = parseFloat(((columns[6])*180) / Math.PI);
          const rudderAngleValue = parseFloat(((columns[16])*180) / Math.PI);
          const windVeloValue = parseFloat(columns[15]/0.51444);

          // Push data to timeAndXY variable
          timeAndXY.time.push(column0Value);
          timeAndXY.X_Position.push(xval);
          timeAndXY.Y_Position.push(yval);
          timeAndXY.headingRadians.push(hr);

          // Push data to individual arrays for each file
          time.push(column0Value);
          X_Position.push(xval);
          Y_Position.push(yval);
          headingRadians.push(hr);
          fwdVelocity.push(fwdVelValue);
          hikingEffect.push(hikingEffectValue);
          boomAngle.push(boomAngleValue);
          heelAngle.push(heelAngleValue);
          heading.push(headingValue);
          rudderAngle.push(rudderAngleValue);
          windVelo.push(windVeloValue);
        }

        const parsedData = {
            metadata,
            courseData,
            timeAndXY,
            time,
            X_Position,
            Y_Position,
            headingRadians,
            fwdVelocity,
            hikingEffect,
            boomAngle,
            heelAngle,
            heading,
            rudderAngle,
            windVelo
        };

        updatedFileData.push(parsedData); // Add parsed data to file data array
    
        return updatedFileData;
      };
  
    return { data, isConnected };
  };