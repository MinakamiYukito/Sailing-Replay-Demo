import { useEffect, useReducer, useState } from "react";
import BoomAngleGraph from "./BoomAngleGraph";
import FwdVelocityGraph from "./FwdVelocityGraph";
import HeadingGraph from "./HeadingGraph";
import HeelAngleGraph from "./HeelAngleGraph";
import HikingEffortGraph from "./HikingEffortGraph";
import RudderAngleGraph from "./RudderAngleGraph";
import WindVelocityGraph from "./WindVelocityGraph";

// All graph option keys (used for checkboxes and mapping)
const GraphOptions = [
  "BOOM_ANGLE", "FWD_VELOCITY", "HEADING", "HEEL_ANGLE",
  "HIKING_EFFORT", "RUDDER_ANGLE", "WIND_VELOCITY",
];

const GraphControlPanel = (props) => {
  const { time, globalClockTime, isAssetLoaded } = props;
  const [frameIndex, setFrameIndex] = useState(0);
  
  // Which graphs to display (at most two at the same time)
  // Toggle logic:
  // - If option already on -> remove it
  // - If turn on a third -> keep only the last two selected
  const [plotsDispState, togglePlotsDispState] = useReducer(
    (state, action) => {
      if (state.includes(action.type)) {
        return state.filter((s) => s !== action.type);
      }
      const newState = [...state, action.type];
      return newState.length > 2 ? newState.slice(1) : newState;
    },
    ["FWD_VELOCITY", "WIND_VELOCITY"]
  );

  useEffect(() => {
    if (!time || time.length === 0) return;
    const newIndex = time.findIndex((t) => t >= globalClockTime);
    if (newIndex !== -1 && newIndex !== frameIndex) {
      setFrameIndex(newIndex);
    }
  }, [globalClockTime, time, frameIndex]);

  const componentMap = {
    BOOM_ANGLE: <BoomAngleGraph key="boom" {...props} frameIndex={frameIndex} />,
    FWD_VELOCITY: <FwdVelocityGraph key="fwd" {...props} frameIndex={frameIndex} />,
    HEADING: <HeadingGraph key="heading" {...props} frameIndex={frameIndex} />,
    HEEL_ANGLE: <HeelAngleGraph key="heel" {...props} frameIndex={frameIndex} />,
    HIKING_EFFORT: <HikingEffortGraph key="hiking" {...props} frameIndex={frameIndex} />,
    RUDDER_ANGLE: <RudderAngleGraph key="rudder" {...props} frameIndex={frameIndex} />,
    WIND_VELOCITY: <WindVelocityGraph key="wind" {...props} frameIndex={frameIndex} />,
  };

  return (
    <div className="graph_panel">
      <div className="graph-options">
        {GraphOptions.map((option) => (
          <p key={option}>
            <label>
              <input
                type="checkbox"
                name={option}
                checked={plotsDispState.includes(option)}
                onChange={(event) => togglePlotsDispState({ type: event.target.name })}
              />
              {option.replace(/_/g, " ")}
            </label>
          </p>
        ))}
      </div>
      <div className="graph_container">
        {plotsDispState.map((dispState) => componentMap[dispState])}
      </div>
    </div>
  );
};

export default GraphControlPanel;