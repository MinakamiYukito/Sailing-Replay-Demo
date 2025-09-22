import BaseChart from "./BaseChart";

const RudderAngleGraph = (props) => {
  return (
    <BaseChart
      {...props}
      title="Rudder Angle"
      dataSeries={props.rudderAngle}
      yAxisLabel="degrees"
    />
  );
};

export default RudderAngleGraph;
