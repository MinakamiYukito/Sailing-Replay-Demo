import BaseChart from "./BaseChart";
const HeelAngleGraph = (props) => {
  return (
    <BaseChart
      {...props}
      title="Heel Angle"
      dataSeries={props.heelAngle}
      yAxisLabel="degrees"
    />
  );
};

export default HeelAngleGraph;