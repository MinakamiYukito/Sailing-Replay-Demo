import { WebSocketServer } from 'ws'; 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import http, { get } from 'http';

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let clients = new Set();

// Function to parse SBP data
const parseSBPData = (data, boatName) => {
  const lines = data.split('\n');
  const updatedFileData = [];

  const metadata = lines[0].split('\t');
  const courseData = `${metadata[4]},${metadata[5]}`;
  const boatId = metadata[2];  
  const time = [];
  const name = boatName;
  const X_Position = [];
  const Y_Position = [];
  const headingRadians = [];
  const fwdVelocity = [];
  const hikingEffect = [];
  const boomAngle = [];
  const heelAngle = [];
  const heading = [];
  const rudderAngle = [];
  const windVelo = [];  

  for (let i = 2; i < lines.length - 1; i++) {
    const columns = lines[i].split('\t');
    // Extract and parse values from columns
    const column0Value = parseFloat(columns[0]) / 60;    
    const xval = parseFloat(columns[1]);
    const yval = parseFloat(columns[2]);
    const hr = ((parseFloat(columns[6]) * 180) / Math.PI) * (Math.PI / 180);
    const fwdVelValue = parseFloat(columns[11]) / -0.51444;
    const hikingEffectValue = parseFloat(columns[14]);
    const boomAngleValue = parseFloat(((columns[7]) * 180) / Math.PI);
    const heelAngleValue = parseFloat(((columns[4]) * 180) / Math.PI);
    const headingValue = parseFloat(((columns[6]) * 180) / Math.PI);
    const rudderAngleValue = parseFloat(((columns[16]) * 180) / Math.PI);
    const windVeloValue = parseFloat(columns[15] / 0.51444);

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
    boatId,
    name,
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
    windVelo,    
  };

  updatedFileData.push(parsedData);

  return updatedFileData;
};

let boatsRecordings = new Map(); // Store recordings for each boat
let clockStartTime = null; // Store the start time of the clock
let clockInterval = null;  // To keep track of the clock's interval
let earliestTime = null; // Store the earliest time in the SBP recording
let currentSbpIndex = 0; // Store the current index of the SBP recording
let sbpTimestamps = []; // Store all SBP timestamps

// Function to extract SBP timestamps from boatsRecordings
const extractSbpTimestamps = () => {
  // Check if there is only one boat in boatsRecordings
  if (Array.from(boatsRecordings.values()).length > 0) {
    // Extract timestamps from the first boat's recordings
    const firstBoatRecordings = Array.from(boatsRecordings.values())[0]; // Get the first boat's recordings
    let timestamps = [];

    firstBoatRecordings.forEach(record => {
      // Assuming record.time is a single timestamp or an array of timestamps
      if (Array.isArray(record.time)) {
        timestamps = timestamps.concat(record.time);  // Flatten the array
      } else {
        timestamps.push(record.time);
      }
    });

    // Sort timestamps and remove duplicates if necessary
    timestamps = [...new Set(timestamps)].sort((a, b) => a - b);
    return timestamps;
  }
  // If there are no boats, return an empty array
  return [];
};

// Function to start the clock
const startClock = () => {
  sbpTimestamps = extractSbpTimestamps();  // Get timestamps dynamically
  earliestTime = Math.min(...sbpTimestamps); // Set the earliest time based on SBP timestamps

  if (!clockStartTime) {
    clockStartTime = Date.now();  // Set the start time
    console.log('Clock start time:', clockStartTime);  
    console.log('Earliest time:', earliestTime);   
    
    // Start the first interval
    scheduleNextBroadcast();
  }
};

const getClockTime = () => {
  if (!clockStartTime) return 0;  // Return 0 if the clock hasn't started
  
  const realWorldElapsedTime = (Date.now() - clockStartTime) / 1000;  // Calculate elapsed time in seconds
  const currentTime = realWorldElapsedTime / 60 + earliestTime;  // Adjust by adding the earliest SBP time in minutes

  console.log('Real world elapsed time:', realWorldElapsedTime);
  console.log('Adjusted current time:', currentTime * 60);

  return currentTime;
};

// Function to schedule the next broadcast
const scheduleNextBroadcast = () => {
  if (currentSbpIndex < sbpTimestamps.length - 1) {    
    // Get current clock time and next SBP time
    const currentTime = getClockTime();
    const nextSbpTime = sbpTimestamps[currentSbpIndex + 1];
    
    // Calculate time difference in milliseconds
    const timeDifference = (nextSbpTime - sbpTimestamps[currentSbpIndex]) * 60 * 1000; // Convert to milliseconds

    // Set a minimum time difference to avoid sending updates too quickly
    const MIN_TIME_DIFFERENCE = 1000; // Adjust this value as needed (200 ms as an example)
    const adjustedTimeDifference = Math.max(timeDifference, MIN_TIME_DIFFERENCE);

    console.log(`Broadcasting time: ${currentTime * 60}, Current Index: ${currentSbpIndex}, Current SBP Time: ${sbpTimestamps[currentSbpIndex] * 60}, Next SBP Time: ${nextSbpTime * 60}, Time Difference: ${timeDifference} ms`);   
    
    // Schedule the next broadcast using the actual time difference
    clockInterval = setTimeout(() => {
      currentSbpIndex++;      
      // Broadcast the current clock time to all clients
      broadcastClockTime(currentTime);
      broadcastBoatDataForCurrentTime(currentTime);
      scheduleNextBroadcast();
    }, adjustedTimeDifference);    
  } else {
    console.log('All SBP timestamps processed');
    clearTimeout(clockInterval);
  }
};

let sessionRequested = false;  // Track if a session has been selected

const broadcastClockTime = (alignedCurrentTime) => {
  console.log('Broadcasting clock time:', alignedCurrentTime * 60);
  clients.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'clock', time: alignedCurrentTime }));
    }
  });
};

// Helper function to find the boat data at the current internal clock time
function findBoatDataAtTime(boatDataArray, clockTime) {
  // // Iterate over the array of boat data objects
  // for (let boatData of boatDataArray) {
  //   // Find the first timestamp greater than the clock time
  //   const index = boatData.time.findIndex((t) => t > clockTime);
    
  //   // If a valid index is found, return the corresponding boat data
  //   if (index !== -1) {
  //     return {
  //       time: boatData.time[index],
  //       metadata: boatData.metadata,
  //       courseData: boatData.courseData,
  //       boatId: boatData.boatId,
  //       name: boatData.name,
  //       X_Position: boatData.X_Position[index],
  //       Y_Position: boatData.Y_Position[index],
  //       headingRadians: boatData.headingRadians[index],
  //       fwdVelocity: boatData.fwdVelocity[index],
  //       hikingEffect: boatData.hikingEffect[index],
  //       boomAngle: boatData.boomAngle[index],
  //       heelAngle: boatData.heelAngle[index],
  //       heading: boatData.heading[index],
  //       rudderAngle: boatData.rudderAngle[index],
  //       windVelo: boatData.windVelo[index],
  //     };
  //   }
  // }

  // // If no valid time data is found, return null values
  // return { 
  //   time: null, 
  //   metadata: null, 
  //   courseData: null, 
  //   boatId: null, 
  //   name: null, 
  //   X_Position: null, 
  //   Y_Position: null, 
  //   headingRadians: null, 
  //   fwdVelocity: null, 
  //   hikingEffect: null, 
  //   boomAngle: null, 
  //   heelAngle: null, 
  //   heading: null, 
  //   rudderAngle: null, 
  //   windVelo: null,
  // };
  // Define arrays to collect data from all matching boats
  const result = {
    time: [],
    metadata: [],
    courseData: null,  // Keep as single value
    boatId: null,  // Keep as single value
    name: [],
    X_Position: [],
    Y_Position: [],
    headingRadians: [],
    fwdVelocity: [],
    hikingEffect: [],
    boomAngle: [],
    heelAngle: [],
    heading: [],
    rudderAngle: [],
    windVelo: [],
  };

  // Iterate over the array of boat data objects
  for (let boatData of boatDataArray) {
    // Find the first timestamp greater than the clock time
    const index = boatData.time.findIndex((t) => t > clockTime);
    
    // If a valid index is found, push the data into the respective arrays
    if (index !== -1) {
      result.time.push(boatData.time[index]);
      result.metadata.push(boatData.metadata);
      
      // Assuming courseData and boatId are constant across records
      if (result.courseData === null) result.courseData = boatData.courseData;
      if (result.boatId === null) result.boatId = boatData.boatId;
      
      result.name.push(boatData.name);
      result.X_Position.push(boatData.X_Position[index]);
      result.Y_Position.push(boatData.Y_Position[index]);
      result.headingRadians.push(boatData.headingRadians[index]);
      result.fwdVelocity.push(boatData.fwdVelocity[index]);
      result.hikingEffect.push(boatData.hikingEffect[index]);
      result.boomAngle.push(boatData.boomAngle[index]);
      result.heelAngle.push(boatData.heelAngle[index]);
      result.heading.push(boatData.heading[index]);
      result.rudderAngle.push(boatData.rudderAngle[index]);
      result.windVelo.push(boatData.windVelo[index]);
    }
  }

  // If no data was found, return nulls for empty arrays
  return result;
}

// Function to broadcast boat data for the current clock time
function broadcastBoatDataForCurrentTime(clockTime) {

  // set up an array to store the boat data
  const boatDataArray = [];

  boatsRecordings.forEach((boatData) => {
    const { 
      time, 
      metadata,
      courseData,
      boatId,
      name,
      X_Position,
      Y_Position,
      headingRadians,
      fwdVelocity,
      hikingEffect,
      boomAngle,
      heelAngle,
      heading,
      rudderAngle,
      windVelo,       
    } = findBoatDataAtTime(boatData, clockTime);

    if (time) {
      const boatUpdate = {        
        time: time,
        metadata: metadata,
        courseData: courseData,
        boatId: boatId,
        name: name,
        X_Position: X_Position,
        Y_Position: Y_Position,
        headingRadians: headingRadians,
        fwdVelocity: fwdVelocity,
        hikingEffect: hikingEffect,
        boomAngle: boomAngle,
        heelAngle: heelAngle,
        heading: heading,
        rudderAngle: rudderAngle,
        windVelo: windVelo,        
      };

      boatDataArray.push(boatUpdate);
      
      // Broadcast this update to all connected clients
      // After collecting the data for all boats, broadcast the array to all clients
      if (boatDataArray.length > 0) {
        clients.forEach((ws) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'boatData', data: boatDataArray }));
          }
        });
      }
    }
  });
}

let clockRunning = false;  // Track if the clock is running

// WebSocket server logic
wss.on('connection', (ws) => {
  console.log('Client connected');
  console.log(`Number of active clients: ${wss.clients.size}`); 
  
  // Add the client to the Set of connected clients
  clients.add(ws);
  
  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message);

    // Check if the message indicates a session selection
    if (parsedMessage.type === 'SESSION_SELECTED') {
      sessionRequested = true;  // Mark that the client has requested the session data
      console.log('Client selected session, starting data transmission...');
    }

    if (parsedMessage.type === 'add-boat') {
      const { boatID, filePath } = parsedMessage.data;
      if (!boatID || !filePath) {
        ws.send(JSON.stringify({ error: 'boatID and filePath are required' }));
        return;
      }

      console.log('Boat ID:', boatID);
      console.log('File Path:', filePath);

      const boatFileName = path.basename(filePath);
      const boatName = path.parse(boatFileName).name;      

      try {
        const boatData = parseSBPData(fs.readFileSync(filePath, 'utf-8'), boatName);
        if (boatData.length === 0) {
          ws.send(JSON.stringify({ error: 'Invalid or empty boat data file.' }));
          return;
        }

        boatsRecordings.set(boatID, boatData);

        if (!clockRunning) {
          const boatTimes = boatData[0].time;
          const boatEarliestTime = Math.min(...boatTimes);

          if (earliestTime === null || boatEarliestTime < earliestTime) {
            earliestTime = boatEarliestTime;
          }

          startClock(); // Start the internal clock
          clockRunning = true;
          console.log('Clock started for the first boat.');
        } else {
          const currentTime = getClockTime();
          const filteredBoatData = boatData.map(dataObj => ({
            ...dataObj,
            time: dataObj.time.filter(time => time > currentTime)
          })).filter(dataObj => dataObj.time.length > 0);

          broadcastClockTime(getClockTime());
          broadcastBoatDataForCurrentTime(getClockTime());
          boatsRecordings.set(boatID, filteredBoatData);
        }
        console.log('Boat data added:', boatsRecordings);
      } catch (error) {
        console.error('Error reading or parsing the file:', error);
        ws.send(JSON.stringify({ error: 'Failed to load the boat data file.' }));
      }
    }    
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);  // Remove client from the Set when disconnected
    console.log('Number of active clients:', wss.clients.size);
  });  

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// API to dynamically add a new boat
app.post('/api/add-boat', (req, res) => {
  const { boatID, filePath } = req.body;

  if (!boatID || !filePath) {
    return res.status(400).json({ message: 'boatID and filePath are required' });
  }

  console.log('Boat ID:', boatID);
  console.log('File Path:', filePath);

  // Extract boat name from the file path
  const boatFileName = path.basename(filePath); 
  const boatName = path.parse(boatFileName).name;

  // const boatFilePath = path.join(__dirname, filePath);
  
  // const fileStream = fs.createReadStream(boatFilePath, { encoding: 'utf-8', highWaterMark: 2000 * 1024 });

  // fileStream.on('data', (chunk) => {  
  //     const parsedChunk = parseSBPData(chunk, boatName);
  //     clients.forEach(ws => {
  //       if (ws.readyState === ws.OPEN) {
  //         ws.send(JSON.stringify({ type: 'graphData', data: parsedChunk }));   // Send parsed data to the WebSocket client
  //       }
  //     });        
  // });

  // fileStream.on('end', () => {  
  //   console.log(`Finished streaming the file to the client`);
  // });

  try {
    const boatData = parseSBPData(fs.readFileSync(filePath, 'utf-8'), boatName);
    console.log('Boat data parsed:', boatData);
    if (boatData.length === 0) {
      console.error('Parsed boat data is empty.');
      return res.status(400).json({ message: 'Invalid or empty boat data file.' });
    }         

    boatsRecordings.set(boatID, boatData);

    if (!clockRunning) {
      // Find the earliest timestamp in the added first boat data    
      const boatTimes = boatData[0].time;
      const boatEarliestTime = Math.min(...boatTimes);
      console.log('Boat earliest time:', boatEarliestTime);

      // Update earliestTime if this boat has a new earliest time
      if (earliestTime === null || boatEarliestTime < earliestTime) {
        earliestTime = boatEarliestTime;
        console.log('Earliest time updated:', earliestTime);
      }
      startClock();       
      clockRunning = true;
      console.log('Clock started for the first boat.');
    } else {
      // For subsequent boats, only send data with timestamps newer than the current clock time
      const currentTime = getClockTime();
      console.log('Current clock time:', currentTime);

      // Filter boat data to only include timestamps newer than the current clock time
      const filteredBoatData = boatData.map(dataObj => {
        const { 
          time, 
          metadata,
          courseData,
          boatId,
          name,
          X_Position,
          Y_Position,
          headingRadians,
          fwdVelocity,
          hikingEffect,
          boomAngle,
          heelAngle,
          heading,
          rudderAngle,
          windVelo,       
        } = dataObj;
        // Filter out times that are older than the current time
        const validIndices = time.map((t, index) => t > currentTime ? index : -1).filter(index => index !== -1);
        // Filter the time array and all other related arrays based on the valid indices
        const filteredTime = validIndices.map(index => time[index]);
        const filteredX_Position = validIndices.map(index => X_Position[index]);
        const filteredY_Position = validIndices.map(index => Y_Position[index]);
        const filteredHeadingRadians = validIndices.map(index => headingRadians[index]);
        const filteredFwdVelocity = validIndices.map(index => fwdVelocity[index]);
        const filteredHikingEffect = validIndices.map(index => hikingEffect[index]);
        const filteredBoomAngle = validIndices.map(index => boomAngle[index]);
        const filteredHeelAngle = validIndices.map(index => heelAngle[index]);
        const filteredHeading = validIndices.map(index => heading[index]);
        const filteredRudderAngle = validIndices.map(index => rudderAngle[index]);
        const filteredWindVelo = validIndices.map(index => windVelo[index]);
        
        return {
          ...dataObj,
          time: filteredTime,  // Keep only newer timestamps
          X_Position: filteredX_Position,
          Y_Position: filteredY_Position,
          headingRadians: filteredHeadingRadians,
          fwdVelocity: filteredFwdVelocity,
          hikingEffect: filteredHikingEffect,
          boomAngle: filteredBoomAngle,
          heelAngle: filteredHeelAngle,
          heading: filteredHeading,
          rudderAngle: filteredRudderAngle,
          windVelo: filteredWindVelo,
          metadata: metadata,
          courseData: courseData,
          boatId: boatId,
          name: name,
        };
      }).filter(dataObj => dataObj.time.length > 0);  // Remove empty time arrays

      broadcastClockTime(currentTime);
      broadcastBoatDataForCurrentTime(currentTime);

      boatsRecordings.set(boatID, filteredBoatData);

      console.log(`Filtered data added for ${boatID}:`, filteredBoatData);
    }
    console.log('Boat data added:', boatsRecordings)
    res.json({ message: `Boat ${boatID} added and recording loaded` });    
  } catch (error) {
    console.error('Error reading or parsing the file:', error);
    return res.status(500).json({ message: 'Failed to load the boat data file.' });
  }
  
});

// API to show sessions list
app.get('/api/sessions-list', (req, res) => {
  const sessions = [{
    id: 'session-1',
    name: 'Boat Race - Test Session',
    startTime: Date.now(),
  }];
  res.json(sessions);
});

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});