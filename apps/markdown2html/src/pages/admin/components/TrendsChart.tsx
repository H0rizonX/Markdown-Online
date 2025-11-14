/**
 * 趋势图组件（散点图）
 * 用于展示趋势数据：文档创建数 / 活跃编辑次数
 */
import { type FC } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

interface TrendsDataItem {
  date: string;
  documentCreations: number;
  activeEdits: number;
}

interface TrendsChartProps {
  data: TrendsDataItem[];
}

const TrendsChart: FC<TrendsChartProps> = ({ data }) => {
  const option: EChartsOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
      },
    },
    legend: {
      data: ["文档创建数", "活跃编辑次数"],
      bottom: 0,
      itemGap: 20,
      icon: "circle",
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.map((item) => item.date),
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 80,
      interval: 10,
    },
    series: [
      {
        name: "文档创建数",
        type: "scatter",
        symbolSize: 10,
        itemStyle: {
          color: "#1890ff",
        },
        data: data.map((item) => item.documentCreations),
      },
      {
        name: "活跃编辑次数",
        type: "scatter",
        symbolSize: 10,
        itemStyle: {
          color: "#52c41a",
        },
        data: data.map((item) => item.activeEdits),
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "300px", width: "100%" }}
    />
  );
};

export default TrendsChart;

