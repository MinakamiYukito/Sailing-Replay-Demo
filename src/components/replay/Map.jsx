// src/components/replay/Map.jsx

import React, { useEffect, useState, useMemo } from "react";
import Plot from "react-plotly.js";
import { useClock } from "../../contexts/ClockContext";

const COLORS = ["red", "blue", "green", "orange", "purple", "yellow", "cyan", "magenta"];
const getColor = (index) => COLORS[index % COLORS.length];

const Map = ({ allData }) => {
  const { globalClockTime } = useClock();
  const [plotData, setPlotData] = useState([]);

  // **优化 1: 使用 useMemo 优化数据转换，避免不必要的重渲染**
  const xyData = useMemo(() => {
    if (!allData || allData.length === 0) {
      return [];
    }
    // 将原始数据转换为更易于处理的 {X, Y, time} 对象数组
    return allData.map((fileData, fileIndex) => {
      const { X_Position, Y_Position, time } = fileData;
      if (X_Position && Y_Position && X_Position.length === Y_Position.length) {
        return X_Position.map((x, i) => ({
          X: x,
          Y: Y_Position[i],
          time: time[i],
          FileIndex: fileIndex,
        })).filter(p => typeof p.time === 'number'); // 过滤掉无效数据
      }
      return [];
    });
  }, [allData]); // 这个计算只在 allData 变化时执行一次

  // **优化 2: 唯一的 useEffect，只负责根据时间生成图表数据**
  useEffect(() => {
    if (xyData.length === 0) return;

    const traces = [];
    xyData.forEach((boatXYData, boatIndex) => {
      // 找出当前时间点之前的所有位置
      const positionsToRender = boatXYData.filter(pos => pos.time <= globalClockTime);
      
      if (positionsToRender.length > 0) {
        const latestPosition = positionsToRender[positionsToRender.length - 1];
        
        // 轨迹线
        traces.push({
          x: positionsToRender.map(p => p.X),
          y: positionsToRender.map(p => p.Y),
          type: 'scatter',
          mode: 'lines',
          line: { color: getColor(boatIndex), width: 2 },
          name: allData[boatIndex]?.name[0] || `Boat-${boatIndex + 1}`, // 从原始数据获取船名
        });

        // 船只当前位置的标记点
        traces.push({
          x: [latestPosition.X],
          y: [latestPosition.Y],
          type: 'scatter',
          mode: 'markers',
          marker: { color: getColor(boatIndex), size: 10 },
          showlegend: false, // 标记点不需要显示在图例中
        });
      }
    });

    setPlotData(traces);
  // **优化 3: 依赖项更干净**
  }, [globalClockTime, xyData, allData]); // allData 在这里是为了获取船名，可以保留


  return (
    <div className="map-plot-container">
      <Plot
        data={plotData}
        layout={{
          title: 'Race Track Map',
          autosize: true,
          margin: { l: 20, r: 20, b: 80, t: 50, pad: 4 }, // 增加了底部边距(b)为图例留出空间
          
          // **核心修改：将图例（提示）移动到图表下方**
          legend: {
            orientation: 'h',   // 'h' = horizontal 水平方向
            y: -0.3,            // 垂直位置（负数表示在图表下方）
            yanchor: 'top',     // 垂直对齐方式
            x: 0.5,             // 水平位置（0.5 表示居中）
            xanchor: 'center',  // 水平对齐方式
          },
          
          xaxis: { showticklabels: false, zeroline: true },
          yaxis: { showticklabels: false, scaleanchor: "x", scaleratio: 1 } // 保持1:1的纵横比
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default Map;