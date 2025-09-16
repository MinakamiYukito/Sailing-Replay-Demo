/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
//import { useCSVReader } from "react-papaparse";
import Papa from 'papaparse';
import "../../style.css";

// eslint-disable-next-line react/prop-types
const [uploadedData, setUploadedData] = useState([]);
const [selectedFiles, setSelectedFiles] = useState([]);
const Landing = ({ setAssetLoaded, setData }) => {


  // const handleData = (result) => {
  //   const [metadata, ...sailData] = result.data;

    // console.log("metadata", metadata);
    //Course type = metadata[4]
    // Course big/small = metadata[5]
 
    // setData.courseData(`${metadata[4].toString()},${metadata[5].toString()}`);

    // setData.time(sailData.map((row) => ({ time: row[0] / 60.0 })));

    // setData.direction(
    //   sailData.map((row) => ({ X_Position: row[1], Y_Position: row[2] }))
    // );

    // setData.timeAndXY(
    //   sailData.map((row) => ({
    //     time: row[0] / 60.0,
    //     X_Position: row[1],
    //     Y_Position: row[2],
    //     headingRadians: ((row[6] * 180) / Math.PI) * (Math.PI / 180),
    //   }))
    // );

    // setData.fwdVelocity(
    //   sailData.map((row) => ({ fwd_velocity: row[6] / -0.3631 }))
    // );

    // setData.hikingEffect(
    //   sailData.map((row) => ({ hiking_effect: row[14] }))
    // );

    // setData.boomAngle(sailData.map(row => row[8]));
    // setData.heelAngle(sailData.map(row => row[10]));
    // setData.heading(sailData.map(row => row[7]));
    // setData.rudderAngle(sailData.map(row => row[9]));
    // setData.windVelo(sailData.map(row => row[5]));
  //};

  const handleFileSelect = (event) => {
    const files = event.target.files;
    const fileNames = [];
 
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      fileNames.push(file.name);
    }
 
    setSelectedFiles(fileNames);
  };
 
  const handleUpload = () => {
    const newData = [];
 
    // Loop through the selected files
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const reader = new FileReader();
 
      reader.onload = (e) => {
        const text = e.target.result;
        // Parse CSV using PapaParse
        const parsedData = Papa.parse(text, { header: true });
        const fileData = {
          filename: file,
          metadata: parsedData.meta,
          data: parsedData.data
        };
        newData.push(fileData);
 
        if (newData.length === selectedFiles.length) {
          // All files are parsed, update state
          setUploadedData(newData);
          console.log(newData);
        }
      };
 
      // Read the file as text
      reader.readAsText(file);
    }
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
        <input type="file" onChange={handleFileSelect} multiple />
        <div>
        <h2>Selected Files:</h2>
        <ul>
          {selectedFiles.map((fileName, index) => (
            <li key={index}>{fileName}</li>
          ))}
        </ul>
        <button onClick={() => {
          handleUpload();
          setAssetLoaded(true);
          }}>Upload</button>
      </div>
      </div>
    </div>
  );
};

export default Landing;
