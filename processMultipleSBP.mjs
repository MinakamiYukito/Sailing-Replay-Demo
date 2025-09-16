import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to parse SBP data
const parseSBPData = (data) => {
  const lines = data.split('\n');
  const updatedFileData = [];

  const metadata = lines[0].split('\t');
  const courseData = `${metadata[4]},${metadata[5]}`;

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

  updatedFileData.push(parsedData);

  return updatedFileData;
};

// Function to combine SBP files and parse them
const combineAndParseSBPFiles = (filePaths, outputPath) => {
  let combinedParsedData = [];

  filePaths.forEach(filePath => {
    const fileData = fs.readFileSync(filePath, 'utf-8');
    const parsedData = parseSBPData(fileData);
    combinedParsedData = combinedParsedData.concat(parsedData);
  });

  fs.writeFileSync(outputPath, JSON.stringify(combinedParsedData, null, 2), 'utf-8');
  console.log('SBP files combined and parsed data written to:', outputPath);
};

// Example usage
const sbpFiles = [
  path.join(__dirname, './Race/Racer1-normal.sbp'),
  path.join(__dirname, './Race/Racer2-easystart.sbp'),
  path.join(__dirname, './Race/Racer3-fasterwind.sbp'),
  path.join(__dirname, './Race/Racer4-longercounterdown.sbp'),
  path.join(__dirname, './Race/casper1.sbp'),
  path.join(__dirname, './Race/ellie1.sbp'),
  // Add more files as needed
];

const outputFilePath = path.join(__dirname, './Race/CombinedData.json');
combineAndParseSBPFiles(sbpFiles, outputFilePath);
