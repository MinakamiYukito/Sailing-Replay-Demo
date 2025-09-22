import React, { useEffect, useReducer, useState } from "react";
import FwdVelocityGraph from "./FwdVelocityGraph";
import HeadingGraph from "./HeadingGraph";
import WindVelocityGraph from "./WindVelocityGraph";
import BoomAngleGraph from "./BoomAngleGraph";
import HeelAngleGraph from "./HeelAngleGraph";
import HikingEffortGraph from "./HikingEffortGraph";
import RudderAngleGraph from "./RudderAngleGraph";

// Graph options (checkbox list)
const GraphOptions = [
  "BOOM_ANGLE", "FWD_VELOCITY", "HEADING", "HEEL_ANGLE",
  "HIKING_EFFORT", "RUDDER_ANGLE", "WIND_VELOCITY",
];

const GraphControlPanel = (props) => {
  const { time: timeArrays, globalClockTime, isAssetLoaded } = props;

  // Current frame index (used by all charts)
  const [frameIndex, setFrameIndex] = useState(0);

  // ===== Build a master time array =====
  // If props.time is an array of time arrays (one per boat/series),
  // pick the longest valid one (ignore invalid or empty arrays).
  const masterTime = Array.isArray(timeArrays)
    ? timeArrays
        .filter(arr => Array.isArray(arr) && arr.length > 0)
        .reduce((a, b) => (a.length > b.length ? a : b), [])
    : [];

  // ===== Control which charts are shown (max 2 at the same time) =====
  // Click on a checkbox:
  // - if already selected -> remove it
  // - if not selected -> add it
  // - keep only 2 (drop the oldest when adding the 3rd)
  const [plotsDispState, togglePlotsDispState] = useReducer(
    (state, action) => {
      if (state.includes(action.type)) {
        return state.filter((s) => s !== action.type); // uncheck -> remove
      }
      const next = [...state, action.type]; // add new
      return next.length > 2 ? next.slice(1) : next; // keep last 2
    },
    ["FWD_VELOCITY", "WIND_VELOCITY"] // default selected charts
  );

  // ===== Update frameIndex from globalClockTime =====
  // Find the first time >= globalClockTime and set frameIndex.
  useEffect(() => {
    if (!masterTime || masterTime.length === 0) return;
    const newIndex = masterTime.findIndex((t) => t >= globalClockTime);
    if (newIndex !== -1 && newIndex !== frameIndex) {
      setFrameIndex(newIndex);
    }
  }, [globalClockTime, masterTime, frameIndex]);

  // Common props passed to all chart components
  const commonGraphProps = {
    ...props,
    time: masterTime,
    frameIndex,
    isRunning: isAssetLoaded,
  };

  // Map option key -> actual chart component
  const componentMap = {
    BOOM_ANGLE:    <BoomAngleGraph     key="boom"    {...commonGraphProps} />,
    FWD_VELOCITY:  <FwdVelocityGraph   key="fwd"     {...commonGraphProps} />,
    HEADING:       <HeadingGraph       key="heading" {...commonGraphProps} />,
    HEEL_ANGLE:    <HeelAngleGraph     key="heel"    {...commonGraphProps} />,
    HIKING_EFFORT: <HikingEffortGraph  key="hiking"  {...commonGraphProps} />,
    RUDDER_ANGLE:  <RudderAngleGraph   key="rudder"  {...commonGraphProps} />,
    WIND_VELOCITY: <WindVelocityGraph  key="wind"    {...commonGraphProps} />,
  };

  return (
    <div className="graph_panel">
      {/* Left side: checkboxes to select charts (max 2) */}
      <div className="graph-options">
        {GraphOptions.map((option) => (
          <p key={option}>
            <label>
              <input
                type="checkbox"
                name={option}
                checked={plotsDispState.includes(option)}
                onChange={(e) => togglePlotsDispState({ type: e.target.name })}
              />
              {option.replace(/_/g, " ")}
            </label>
          </p>
        ))}
      </div>

      {/* Right side: render selected charts */}
      <div className="graph_container">
        {plotsDispState.map((key) => componentMap[key])}
      </div>
    </div>
  );
};

export default GraphControlPanel;
