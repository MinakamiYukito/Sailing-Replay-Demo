import BaseChart from "./BaseChart";

const BoomAngleGraph = (props) => {
  return (
    <BaseChart
      {...props} 
      title="Boom Angle"
      dataSeries={props.boomAngle}
      yAxisLabel="degrees"
    />
  );
};

export default BoomAngleGraph;