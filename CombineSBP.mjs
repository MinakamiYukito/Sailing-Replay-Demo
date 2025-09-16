// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// // Resolve __dirname for ES module
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const combineSBPFiles = (filePaths, outputPath) => {
//   let combinedData = [];

//   // filePaths.forEach((filePath, index) => {
//   //   const fileData = fs.readFileSync(filePath, 'utf-8');
//   //   // const boatID = `Boat${index + 1}`;

//   //   // Append boat ID to each line to differentiate data
//   //   const dataWithID = fileData
//   //     .split('\n')
//   //     .map(line => (line)) // Prepend boat ID
//   //     .join('\n');

//   //   combinedData += dataWithID + '\n';
//   // });

//   // Read all files and parse them into arrays of objects
//   const parsedFiles = filePaths.map(filePath => {
//     const fileData = fs.readFileSync(filePath, 'utf-8');
//     return fileData.split('\n').filter(line => line.trim() !== ''); // Remove empty lines
//   });

//   // Assuming each line starts with a timestamp as the first column
//   let minLines = Math.min(...parsedFiles.map(file => file.length)); // Get the shortest file length to synchronize data

//   for (let i = 0; i < minLines; i++) {
//     parsedFiles.forEach(fileData => {
//       if (fileData[i]) {
//         combinedData.push(fileData[i]);
//       }
//     });
//   }

//   // Write combined data to output file
//   fs.writeFileSync(outputPath, combinedData, 'utf-8');
// };

// // Example usage
// const sbpFiles = [
//   path.join(__dirname, './Race/Racer1-normal.sbp'),
//   path.join(__dirname, './Race/Racer2-easystart.sbp'),
//   // Add more files as needed
// ];

// const outputFilePath = path.join(__dirname, './Race/Combined1.sbp');
// combineSBPFiles(sbpFiles, outputFilePath);
// console.log('SBP files combined into:', outputFilePath);
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to combine SBP files and synchronize data by timestamps
const combineSBPFiles = (filePaths, outputPath) => {
  let combinedData = [];

  // Read all files and parse them into arrays of objects
  const parsedFiles = filePaths.map(filePath => {
    const fileData = fs.readFileSync(filePath, 'utf-8');
    return fileData.split('\n').filter(line => line.trim() !== ''); // Remove empty lines
  });

  // Assuming each line starts with a timestamp as the first column
  let minLines = Math.min(...parsedFiles.map(file => file.length)); // Get the shortest file length to synchronize data

  for (let i = 0; i < minLines; i++) {
    parsedFiles.forEach(fileData => {
      if (fileData[i]) {
        combinedData.push(fileData[i]);
      }
    });
  }

  // Convert combined data array to a string with newline characters
  const combinedDataString = combinedData.join('\n');

  // Write combined data to output file
  fs.writeFileSync(outputPath, combinedDataString, 'utf-8');
};

// Example usage
const sbpFiles = [
  path.join(__dirname, './Race/Racer1-normal.sbp'),
  path.join(__dirname, './Race/Racer2-easystart.sbp'),
  // Add more files as needed
];

const outputFilePath = path.join(__dirname, './Race/Combined.sbp');
combineSBPFiles(sbpFiles, outputFilePath);
console.log('SBP files combined into:', outputFilePath);
