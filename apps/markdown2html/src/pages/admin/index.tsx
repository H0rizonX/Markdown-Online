import { type FC } from "react";
import { Card, Row, Col } from "antd";
import StatCard from "./components/StatCard";
import TrendsChart from "./components/TrendsChart";
import VisibilityChart from "./components/VisibilityChart";
import TeamAccessChart from "./components/TeamAccessChart";
// import { getDashboardData } from "./service";

const AdminDashboard: FC = () => {
  // 模拟数据，后续可以替换为真实 API 数据
  // 对接真实 API 示例：
  // const [dashboardData, setDashboardData] = useState(null);
  // useEffect(() => {
  //   const fetchData = async () => {
  //     const data = await getDashboardData();
  //     setDashboardData(data);
  //   };
  //   fetchData();
  // }, []);
  const statData = {
    activeUsers: 2,
    collaborationSessions: 3,
  };

  const trendsData = [
    {
      date: "2025-11-13",
      documentCreations: 10,
      activeEdits: 70,
    },
  ];

  const visibilityData = [
    { name: "团队", value: 90.91 },
    { name: "个人", value: 9.09 },
  ];

  const teamAccessData = [
    { name: "团队5", value: 26 },
    { name: "团队1", value: 25 },
    { name: "团队2", value: 17 },
    { name: "团队3", value: 5 },
    { name: "团队4", value: 3 },
    { name: "其他", value: 1 },
  ];

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">数据统计</h1>
      </div>

      {/* 顶部统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12}>
          <StatCard
            title="活跃用户数(近7天)"
            value={statData.activeUsers}
          />
        </Col>
        <Col xs={24} sm={12}>
          <StatCard
            title="协同会话数(近7天)"
            value={statData.collaborationSessions}
          />
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]}>
        {/* 左下：趋势图 */}
        <Col xs={24} lg={12}>
          <Card title="趋势 (文档创建 / 活跃编辑)" className="h-full">
            <TrendsChart data={trendsData} />
          </Card>
        </Col>

        {/* 右下：文档可见性占比 */}
        <Col xs={24} lg={12}>
          <Card title="文档可见性占比" className="h-full">
            <VisibilityChart data={visibilityData} />
          </Card>
        </Col>

        {/* 团队访问 Top5 */}
        <Col xs={24}>
          <Card title="团队文档访问量">
            <div className="mb-4 text-center">
              <h3 className="text-base font-medium">团队访问 Top5 (其余合并)</h3>
            </div>
            <TeamAccessChart data={teamAccessData} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;

