import React, { useState, useEffect } from 'react';
import "../../style.css";

const AddBoatForm = ({ onClose, onAddBoat }) => {
  const boatOptions = [
    { boatID: 'Boat1', filePath: './Race/Racer1-normal.sbp' },
    { boatID: 'Boat2', filePath: './Race/Racer2-easystart.sbp' },
    { boatID: 'Boat3', filePath: './Race/Racer3-fasterwind.sbp' }
  ];

  const [selectedBoats, setSelectedBoats] = useState([]);
  const [selectedBoatOption, setSelectedBoatOption] = useState('');

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const [boatID, filePath] = selectedBoatOption.split('|');

//     fetch('http://localhost:8080/api/add-boat', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ boatID, filePath }),
//     })
//     .then((response) => response.json())
//     .then((data) => {
//       setSelectedBoats((prevSelectedBoats) => [...prevSelectedBoats, boatID]);
//       setSelectedBoatOption('');
//       onClose();  // Close the form after submission
//     })
//     .catch((error) => {
//       console.error('Error adding boat:', error);
//     });
//   };

const handleSubmit = (e) => {
    e.preventDefault();
    const [boatID, filePath] = selectedBoatOption.split('|');

    // Call the parent-provided function to send the boat data to WebSocket
    onAddBoat({ boatID, filePath });

    // Track the selected boats to ensure they're not added twice
    setSelectedBoats((prevSelectedBoats) => [...prevSelectedBoats, boatID]);
    setSelectedBoatOption('');
    onClose();  // Close the form after submission
  };

  const availableBoatOptions = boatOptions.filter(option => !selectedBoats.includes(option.boatID));

  return (
    <div className="add-boat-form-overlay">
      <div className="add-boat-form">
        <h1>Add New Boat</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="boatSelect">Select Boat:</label>
            <select
              id="boatSelect"
              value={selectedBoatOption}
              onChange={(e) => setSelectedBoatOption(e.target.value)}
              required
            >
              <option value="" disabled>Select a Boat and File Path</option>
              {availableBoatOptions.map((option, index) => (
                <option key={index} value={`${option.boatID}|${option.filePath}`}>
                  {option.boatID} - {option.filePath}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={!selectedBoatOption}>Add Boat</button>
        </form>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

const BoatStreamingManager = ({ onAddBoat }) => {
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Show the form when 'Ctrl + B' is pressed
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        setShowForm(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div>
      <h1>Boat Manager</h1>
      {showForm && <AddBoatForm onClose={() => setShowForm(false)} onAddBoat={onAddBoat}/>}

      {/* Other content here */}
      <p>Press "Ctrl + E" to add a new boat</p>
    </div>
  );
};

export default BoatStreamingManager;
