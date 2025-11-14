/**
 * 统计卡片组件
 * 用于显示统计数据，如：活跃用户数(近7天)、协同会话数(近7天) 等
 */
import { type FC } from "react";
import { Card } from "antd";

interface StatCardProps {
  title: string;
  value: number;
}

const StatCard: FC<StatCardProps> = ({ title, value }) => {
  return (
    <Card className="h-full">
      <div className="text-center">
        <div className="text-gray-600 text-sm mb-2">{title}</div>
        <div className="text-3xl font-bold text-gray-800">{value}</div>
      </div>
    </Card>
  );
};

export default StatCard;

