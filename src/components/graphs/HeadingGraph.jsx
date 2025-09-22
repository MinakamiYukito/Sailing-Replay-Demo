import BaseChart from "./BaseChart";

const HeadingGraph = (props) => {
  return (
    <BaseChart
      {...props}
      title="Heading"
      dataSeries={props.heading}
      valueFormatter={(value) => value.toFixed(0)}
    />
  );
};

export default HeadingGraph;