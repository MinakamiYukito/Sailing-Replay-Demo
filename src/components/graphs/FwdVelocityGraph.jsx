import BaseChart from "./BaseChart";

const FwdVelocityGraph = (props) => {
  return (
    <BaseChart
      {...props}
      title="Forward Velocity"
      dataSeries={props.fwdVelo}
      valueFormatter={(value) => value.toFixed(2)}
    />
  );
};

export default FwdVelocityGraph;