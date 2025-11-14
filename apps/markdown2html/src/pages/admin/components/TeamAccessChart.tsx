/**
 * 团队访问 Top5 柱状图组件
 * 用于展示团队文档访问量数据：团队访问 Top5 (其余合并)
 */
import { type FC } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

interface TeamAccessDataItem {
  name: string;
  value: number;
}

interface TeamAccessChartProps {
  data: TeamAccessDataItem[];
}

const TeamAccessChart: FC<TeamAccessChartProps> = ({ data }) => {
  const option: EChartsOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.name),
      axisTick: {
        alignWithLabel: true,
      },
    },
    yAxis: {
      type: "value",
      name: "访问量",
      min: 0,
      max: 30,
      interval: 5,
    },
    series: [
      {
        name: "访问量",
        type: "bar",
        barWidth: "60%",
        itemStyle: {
          color: "#ff7f50",
          borderRadius: [4, 4, 0, 0],
        },
        data: data.map((item) => item.value),
        label: {
          show: true,
          position: "top",
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "400px", width: "100%" }}
    />
  );
};

export default TeamAccessChart;

