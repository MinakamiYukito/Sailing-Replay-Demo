import React, { useState } from 'react';
import '../Landing.css';

const Landing = ({ onDataReceived }) => {
  const demoFiles = [
    { id: 'r1', label: 'Racer1 (normal)', path: '/Race/Racer1-normal.sbp' },
    { id: 'r2', label: 'Racer2 (easystart)', path: '/Race/Racer2-easystart.sbp' },
    { id: 'r3', label: 'Racer3 (fasterwind)', path: '/Race/Racer3-fasterwind.sbp' },
    { id: 'r4', label: 'Racer4 (longercountdown)', path: '/Race/Racer4-longercounterdown.sbp' },
  ];

  const [selected, setSelected] = useState(() =>
    Object.fromEntries(demoFiles.map(d => [d.id, true]))
  );

  const handleToggle = (id) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLoadSelected = async () => {
    const chosen = demoFiles.filter(d => selected[d.id]);
    if (chosen.length === 0) {
      alert('Please select at least one demo.');
      return;
    }
    try {
      const files = [];
      for (const d of chosen) {
        const res = await fetch(d.path);
        if (!res.ok) throw new Error(`HTTP ${res.status} at ${d.path}`);
        const text = await res.text();
        const name = d.path.split('/').pop();
        files.push(new File([text], name, { type: 'text/plain' }));
      }
      parseSBPFiles(files);
    } catch (e) {
      console.error('load demo failed：', e);
      alert('Failed to load selected demos.');
    }
  };

  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const sbpFiles = Array.from(files).filter(file => file.name.endsWith('.sbp'));
      if (sbpFiles.length > 0) {
        parseSBPFiles(sbpFiles);
      }
    }
  };

  const parseSBPFiles = (files) => {
    const allFilesParsedData = [];
    let filesProcessed = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        const lines = text.split('\n');
        if (lines.length < 2) {
          filesProcessed++;
          if (filesProcessed === files.length) onDataReceived(allFilesParsedData);
          return;
        }

        const metadata = lines[0].split('\t');
        const boatId = metadata[2];
        const courseData = `${metadata[4]},${metadata[5]}`;
        const name = file.name;

        const time = [], X_Position = [], Y_Position = [], headingRadians = [], fwdVelocity = [],
              hikingEffect = [], boomAngle = [], heelAngle = [], heading = [], rudderAngle = [], windVelo = [];

        for (let i = 1; i < lines.length; i++) {
          const columns = lines[i].split('\t');
          if (columns.length < 17) continue;

          time.push(parseFloat(columns[0]) / 60);
          X_Position.push(parseFloat(columns[1]));
          Y_Position.push(parseFloat(columns[2]));
          headingRadians.push(parseFloat(columns[6]));
          fwdVelocity.push(parseFloat(columns[11]) / -0.51444);
          hikingEffect.push(parseFloat(columns[14]));
          boomAngle.push((parseFloat(columns[7]) * 180) / Math.PI);
          heelAngle.push((parseFloat(columns[4]) * 180) / Math.PI);
          heading.push((parseFloat(columns[6]) * 180) / Math.PI);
          rudderAngle.push((parseFloat(columns[16]) * 180) / Math.PI);
          windVelo.push(parseFloat(columns[15]) / 0.51444);
        }

        const parsedData = {
          metadata, courseData, boatId, name: [name], time, X_Position, Y_Position, headingRadians,
          fwdVelocity, hikingEffect, boomAngle, heelAngle, heading, rudderAngle, windVelo,
        };

        allFilesParsedData.push(parsedData);
        filesProcessed++;
        if (filesProcessed === files.length) onDataReceived(allFilesParsedData);
      };
      reader.readAsText(file);
    });
  };

  return (
    <div className="landing-container">
      <div className="content-card">
        <h1>Sail Replay</h1>
        <h3>Relive Your Sailing Experience</h3>
        <h3 style={{ marginTop: '20px' }}>by Zehang Chen</h3>

        <p className="subtitle">Upload SBP files to begin</p>
        <input
          type="file"
          id="file"
          className="file-input"
          multiple
          accept=".sbp"
          onChange={handleFileUpload}
        />
        <label htmlFor="file" className="file-input-label">Choose Files</label>

        <div style={{ marginTop: 30, textAlign: 'center' }}>
          <p className="subtitle" style={{ marginBottom: 12 }}>Or load demo files</p>
          <div style={{ display: 'inline-block', textAlign: 'left' }}>
            {demoFiles.map(d => (
              <label key={d.id} style={{ display: 'block', margin: '6px 0' }}>
                <input
                  type="checkbox"
                  checked={!!selected[d.id]}
                  onChange={() => handleToggle(d.id)}
                  style={{ marginRight: 8 }}
                />
                {d.label}
              </label>
            ))}
          </div>
          <div style={{ marginTop: 15 }}>
            <button className="file-input-label" type="button" onClick={handleLoadSelected}>
              Load Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
