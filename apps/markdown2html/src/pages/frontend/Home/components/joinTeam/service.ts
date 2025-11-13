import type { resType } from "../../../../../types/common";
import { request } from "../../../../../utils";

export const join = async (params: {
  token: string;
  userId: number;
}): Promise<resType> => {
  return await request.post("/team/join", params);
};
