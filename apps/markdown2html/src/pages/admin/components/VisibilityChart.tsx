/**
 * 文档可见性占比环形图组件
 * 用于展示文档可见性占比数据：团队、个人等
 */
import { type FC } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

interface VisibilityDataItem {
  name: string;
  value: number;
}

interface VisibilityChartProps {
  data: VisibilityDataItem[];
}

const VisibilityChart: FC<VisibilityChartProps> = ({ data }) => {
  const option: EChartsOption = {
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c}% ({d}%)",
    },
    legend: {
      orient: "horizontal",
      left: "center",
      bottom: 0,
      data: data.map((item) => item.name),
      icon: "rect",
      itemGap: 20,
    },
    series: [
      {
        name: "文档可见性",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: "{b}: {c}%",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: true,
        },
        data: data.map((item, index) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: index === 0 ? "#1890ff" : "#52c41a",
          },
        })),
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

export default VisibilityChart;

