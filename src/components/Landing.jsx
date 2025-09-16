import React, { useState, useEffect } from 'react';
// import 'bootstrap/dist/css/bootstrap.min.css';
import "../../style.css";
import SessionsList from './SessionsList.jsx';
import Loading from './Loading.jsx';
import { Modal, Button } from 'react-bootstrap';
import BoatStreamingManager from './BoatStreamingManager.jsx';

window.isLiveData = false;

const Landing = ({ onDataReceived, liveData, isConnected, onAssetLoaded, sendMessage, connectWebSocket }) => {
  const [fileData, setFileData] = useState([]);
  const [isLiveData, setIsLiveData] = useState(false);
  const [isPlaybackStarted, setIsPlaybackStarted] = useState(false);
  const [isSessionSelected, setIsSessionSelected] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timeAndXY, setTimeAndXY] = useState({
    time: [],
    X_Position: [],
    Y_Position: [],
    headingRadians: [],
  });
  

  const handleFileUpload = (event) => {
    const files = event.target.files;
    const sbpFiles = Array.from(files).filter((file) =>
      file.name.endsWith(".sbp")
    );
    parseSBPFiles(sbpFiles);
    setIsPlaybackStarted(true);
    setIsLiveData(false);
    window.isLiveData = false;
  };

  const handleShowSessionsList = () => {    
    // switch to SessionsList component and display the list of sessions
    // setIsLoading(true);
    setShowModal(true);    
  };

  const handleCloseModal = () => {
    setShowModal(false);  // Hide the modal when closed
  }; 

  const handleSessionSelection = (session) => {
    console.log(`Session ${session.name} selected`);
    setIsSessionSelected(true);
    sendMessage(JSON.stringify({ type: 'SESSION_SELECTED', sessionId: session.id }));
    // connectWebSocket();
    setIsLoading(true);    
  };

  const handleKeyDown = (event) => {
    if (event.ctrlKey && event.key === 'b') {
      event.preventDefault(); // Prevent default behavior
      setShowForm((prev) => !prev); // Toggle the form visibility
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown); // Add the event listener

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);


  const parseSBPFiles = (files) => {
    const updatedFileData = []; // Create a new array to store parsed data for each file

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        const lines = text.split("\n");
        const metadata = lines[0].split("\t");
        const boatId = metadata[2]; // Add boat ID
        const courseData = `${metadata[4]},${metadata[5]}`;
        const name = [file.name];
        const time = []; // Array to store column 0 data
        const X_Position = [];
        const Y_Position = [];
        const headingRadians = [];
        const fwdVelocity = []; // Array to store fwd_velocity data
        const hikingEffect = []; // Array to store hiking_effect data
        const boomAngle = []; // Array to store boomAngle data
        const heelAngle = []; // Array to store heelAngle data
        const heading = []; // Array to store heading data
        const rudderAngle = []; // Array to store rudderAngle data
        const windVelo = []; // Array to store windVelo data

        for (let i = 1; i < lines.length; i++) {
          const columns = lines[i].split("\t");
          const column0Value = parseFloat(columns[0]) / 60;
          const xval = parseFloat(columns[1]);
          const yval = parseFloat(columns[2]);
          const hr =
            ((parseFloat(columns[6]) * 180) / Math.PI) * (Math.PI / 180);
          const fwdVelValue = parseFloat(columns[11]) / -0.51444;
          const hikingEffectValue = parseFloat(columns[14]);
          const boomAngleValue = parseFloat((columns[7] * 180) / Math.PI);
          const heelAngleValue = parseFloat((columns[4] * 180) / Math.PI);
          const headingValue = parseFloat((columns[6] * 180) / Math.PI);
          const rudderAngleValue = parseFloat((columns[16] * 180) / Math.PI);
          const windVeloValue = parseFloat(columns[15] / 0.51444);

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
          boatId, // Include the boatId here
          timeAndXY,
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
        console.log(`updatedFileData: ${updatedFileData}`);
        if (updatedFileData.length === files.length) {
          // If all files are parsed, call onDataReceived with parsed data
          onDataReceived(updatedFileData, false);
        }
      };
      reader.readAsText(file);
    });
  };

  return (    
      <div className="row">       
        <div id="boat">
          <img src="/boat.png" alt={"Boat"} />
        </div>      
          <div id="content">
            <br />
            <br />
            <h1>Sail Replay: Relive Your Sailing Experience</h1>
            <br />
            <h3>Personal Demo Version</h3> 
            <h3>by Zehang Chen</h3>
            <br />
            {/* <img
              id="logo"
              src="logo.png"
              alt={`Swinburne Logo`}
              style={{ maxWidth: "150px", maxHeight: "auto" }}
            />         */}
            <h2>Upload SBP files</h2>	  
            <input type="file" multiple accept=".sbp" style={{fontSize: "16px", fontWeight: "bold"}}  onChange={handleFileUpload} />
            <br />
            <h2>Live Data Stream Replay</h2>
            <button style={{borderRadius: "5px", width: "160px", height: "50px", fontSize: "15px", fontWeight: "bold"}} onClick={handleShowSessionsList}>Show Sessions List</button>
            {showForm && <BoatStreamingManager />}
            {/* Modal for Sessions List */}
            {/* Bootstrap modal wrapped in a class */}
            <div className="bootstrap-modal">
              {
                isLoading ? (
                  <Modal show={showModal} size="lg">           
                <Modal.Body>                  
                    <Loading /> 
                </Modal.Body>                
              </Modal>) : (
              <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                  <Modal.Title>Sessions List</Modal.Title>
                </Modal.Header>
                <Modal.Body>                  
                    <SessionsList
                      onDataReceived={onDataReceived}
                      liveData={liveData}
                      isConnected={isConnected}
                      onAssetLoaded={onAssetLoaded}
                      onSelectSession={handleSessionSelection}
                      setIsLoading={setIsLoading} // Pass the function to child to manage loading
                    />                  
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseModal}>
                    Close
                  </Button>
                </Modal.Footer>
              </Modal>)}
            </div>
          </div>
        </div>
  ); 
};

export default Landing;