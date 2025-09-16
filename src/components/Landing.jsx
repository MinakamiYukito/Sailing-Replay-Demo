import React, { useState } from 'react';
import "../../style.css";

const Landing = ({ onDataReceived }) => {
  // State for file data is removed as it's passed directly up via onDataReceived
  // const [fileData, setFileData] = useState([]);
  const [isPlaybackStarted, setIsPlaybackStarted] = useState(false);

  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      const sbpFiles = Array.from(files).filter((file) =>
        file.name.endsWith(".sbp")
      );
      if (sbpFiles.length > 0) {
        parseSBPFiles(sbpFiles);
        setIsPlaybackStarted(true);
      }
    }
  };

  const parseSBPFiles = (files) => {
    const allFilesParsedData = [];

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        const lines = text.split("\n");
        if (lines.length < 2) return; // Skip empty or header-only files

        // Initialize data arrays for this specific file
        const metadata = lines[0].split("\t");
        const boatId = metadata[2];
        const courseData = `${metadata[4]},${metadata[5]}`;
        const name = file.name;

        // Data arrays for this single file
        const time = [];
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

        for (let i = 1; i < lines.length; i++) {
          const columns = lines[i].split("\t");
          if (columns.length < 17) continue; // Basic check for valid data row

          // Parse and calculate values
          const column0Value = parseFloat(columns[0]) / 60;
          const xval = parseFloat(columns[1]);
          const yval = parseFloat(columns[2]);
          const hr = ((parseFloat(columns[6]) * 180) / Math.PI) * (Math.PI / 180);
          const fwdVelValue = parseFloat(columns[11]) / -0.51444;
          const hikingEffectValue = parseFloat(columns[14]);
          const boomAngleValue = parseFloat((columns[7] * 180) / Math.PI);
          const heelAngleValue = parseFloat((columns[4] * 180) / Math.PI);
          const headingValue = parseFloat((columns[6] * 180) / Math.PI);
          const rudderAngleValue = parseFloat((columns[16] * 180) / Math.PI);
          const windVeloValue = parseFloat(columns[15] / 0.51444);

          // Push data to arrays for this file
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
        
        // This object contains all data for a single parsed file
        const parsedData = {
          metadata,
          courseData,
          boatId,
          name: [name], // Keep as an array for consistency
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

        allFilesParsedData.push(parsedData);
        
        // If all files have been processed, call the parent callback
        if (allFilesParsedData.length === files.length) {
          onDataReceived(allFilesParsedData, false); // The second argument 'false' indicates it's not live data
        }
      };
      reader.readAsText(file);
    });
  };

  return (
    <div className="row">
      <div id="boat">
        <img src="/boat.png" alt="Boat" />
      </div>
      <div id="content">
        <br />
        <br />
        <h1>Sail Replay: Relive Your Sailing Experience</h1>
        <br />
        <h3>Personal Demo Version</h3>
        <h3>by Zehang Chen</h3>
        <br />
        <h2>Upload SBP files to begin</h2>
        <input
          type="file"
          multiple
          accept=".sbp"
          style={{ fontSize: "16px", fontWeight: "bold" }}
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
};

export default Landing;