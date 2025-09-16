/* eslint-disable react/prop-types */
import { useState, useRef } from 'react';
import Papa from 'papaparse';
import "../../style.css";
const Landing = ({ setAssetLoaded, setData }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);

const handleFileSelect = (event) => {
    const files = event.target.files;
    const allFileData = [];
    const courseData = [];
    
    // Loop through the selected files
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        reader.onload = (e) => {
            const text = e.target.result;
            // Parse CSV using PapaParse
            const parsedData = Papa.parse(text, {
                header: false, // No header row
                delimiter: '\t' // Assuming tab-delimited
            });

            // Extract metadata from the first row
            const metadata = parsedData.data[0];
            courseData[i] = `${metadata[4]},${metadata[5]}`;

            // Initialize an array to store column data for this file
            const fileColumns = new Array(parsedData.data[0].length).fill(null).map(() => []);

            // Loop through each row of data
            for (let j = 1; j < parsedData.data.length; j++) {
                const columns = parsedData.data[j];
                //console.log(j,columns);

                // Store each column's data in the fileColumns array
                for (let k = 0; k < columns.length; k++) {
                    fileColumns[k].push(columns[k]);
                }
            }
            
            // Push the file's data into the allFileData array
            allFileData.push({
                filename: file.name,
                metadata: metadata,
                data: fileColumns
            });
            console.log
            // If all files are parsed, update state
            if (allFileData.length === files.length) {
                handleData(allFileData);
            }
        };

        reader.readAsText(file);
    }
};

  

  const handleData = (results) => {
    const allData = [];

    // Loop through each result
    results.forEach(result => {
      const [metadata, ...sailData] = result.data;
      //console.log(metadata+"--->");
      const fileData = {
        courseData: `${metadata[4].toString()},${metadata[5].toString()}`,
        time: sailData.map((row) => ({ time: row[0] / 60.0 })),
        direction: sailData.map((row) => ({ X_Position: row[1], Y_Position: row[2] })),
        timeAndXY: sailData.map((row) => ({
          time: row[0] / 60.0,
          X_Position: row[1],
          Y_Position: row[2],
          headingRadians: ((row[6] * 180) / Math.PI) * (Math.PI / 180),
        })),
        fwdVelocity: sailData.map((row) => ({ fwd_velocity: row[6] / -0.3631 })),
        hikingEffect: sailData.map((row) => ({ hiking_effect: row[14] })),
        boomAngle: sailData.map(row => row[8]),
        heelAngle: sailData.map(row => row[10]),
        heading: sailData.map(row => row[7]),
        rudderAngle: sailData.map(row => row[9]),
        windVelo: sailData.map(row => row[5]),
      };

      allData.push(fileData);
    });

    // Do something with allData, such as storing it in state
    //setData(allData);
  };

  return (
    <div className="row">
      <div id="boat">
        <img src="boat.png" alt={`Boat`} />
      </div>
      <div id="content">
        <br />
        <br />
        <h1>Sail Replay: Relive Your Sailing Experience</h1>
        <br />
        <h3>In Collaboration with:</h3>
        <br />
        <img id="logo" src="logo.png" alt={`Swinburne Logo`} />
        <br />
        <br />
        <br />
        <br />
        <hr />
        <br />
        <h2>Upload SBP file to continue</h2>
        <br />
        <input id="fileInput" type="file" onChange={handleFileSelect} accept={`.sbp`} multiple />
        <div>
          <h2>Selected Files:</h2>
          <ol>
            {selectedFiles.map((fileName, index) => (
              <li key={index}>{fileName}</li>
            ))}
          </ol>
          <button onClick={() => { handleData(); setAssetLoaded(true); }}>Upload</button>


        </div>
      </div>
    </div>
  );
};


export default Landing;
