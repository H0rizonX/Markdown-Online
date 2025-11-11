import type { resType } from "../../../../../types/common";
import { request } from "../../../../../utils";
import type { TeamType } from "../createTeam/service";

export const getAllteam = async (id: number): Promise<resType> => {
  return await request.get(`/team/findAll/${id}`);
};

export const leaveTeam = async (params: {
  teamId: number;
  userId: number;
}): Promise<resType> => {
  return await request.post("/team/exit", params);
};

export const deleteTeam = async (id: number): Promise<resType> => {
  return await request.delete(`/team/delete/${id}`);
};

export const getInvitedUrl = async (id: number): Promise<resType> => {
  return await request.get(`/team/${id}/invite`);
};

export const updatedTeamInfo = async (params: TeamType): Promise<resType> => {
  const { id, name, description, tags } = params;
  return await request.put(`/team/update/${id}`, { name, description, tags });
};
