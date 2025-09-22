import BaseChart from "./BaseChart";

const HikingEffortGraph = (props) => {
  return (
    <BaseChart
      {...props}
      title="Hiking Effort"
      dataSeries={props.hiking}
      yAxisLabel="Effort"
    />
  );
};

export default HikingEffortGraph;