import type { resType, UserType } from "../../../../../types/common";
import { request } from "../../../../../utils";

export interface TeamType {
  id?: number;
  name?: string;
  ownerId?: number;
  owner?: UserType;
  avatar?: string;
  description?: string;
  memberCount?: number;
  tags?: string[];
  members?: UserType[];
  createdAt?: string;
  updatedAt?: string;
}

export const createTeam = async (params: TeamType): Promise<resType> => {
  return await request.post("/team/create", params);
};
