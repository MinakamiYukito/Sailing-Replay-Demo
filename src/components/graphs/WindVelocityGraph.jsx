import BaseChart from "./BaseChart";

const WindVelocityGraph = (props) => {
  return (
    <BaseChart
      {...props}
      title="Wind Velocity"
      dataSeries={props.windVelo} 
      yAxisLabel="knots"          
    />
  );
};

export default WindVelocityGraph;