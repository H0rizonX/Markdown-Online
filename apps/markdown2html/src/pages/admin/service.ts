import request from "../../utils/request";

// 埋点数据接口类型定义
export interface StatData {
  activeUsers: number;
  collaborationSessions: number;
}

export interface TrendsDataItem {
  date: string;
  documentCreations: number;
  activeEdits: number;
}

export interface VisibilityDataItem {
  name: string;
  value: number;
}

export interface TeamAccessDataItem {
  name: string;
  value: number;
}

export interface DashboardData {
  stats: StatData;
  trends: TrendsDataItem[];
  visibility: VisibilityDataItem[];
  teamAccess: TeamAccessDataItem[];
}

// 获取埋点统计数据
export const getDashboardData = async (): Promise<DashboardData> => {
  const response = await request.get<DashboardData>("/admin/dashboard");
  return response.data;
};

// 获取活跃用户数（近7天）
export const getActiveUsers = async (): Promise<number> => {
  const response = await request.get<{ count: number }>("/admin/stats/active-users");
  return response.data.count;
};

// 获取协同会话数（近7天）
export const getCollaborationSessions = async (): Promise<number> => {
  const response = await request.get<{ count: number }>("/admin/stats/collaboration-sessions");
  return response.data.count;
};

// 获取趋势数据
export const getTrendsData = async (): Promise<TrendsDataItem[]> => {
  const response = await request.get<TrendsDataItem[]>("/admin/trends");
  return response.data;
};

// 获取文档可见性占比
export const getVisibilityData = async (): Promise<VisibilityDataItem[]> => {
  const response = await request.get<VisibilityDataItem[]>("/admin/visibility");
  return response.data;
};

// 获取团队访问 Top5
export const getTeamAccessData = async (): Promise<TeamAccessDataItem[]> => {
  const response = await request.get<TeamAccessDataItem[]>("/admin/team-access");
  return response.data;
};

