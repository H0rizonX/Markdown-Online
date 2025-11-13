import type { ArticleType, resType } from "../../../../../types/common";
import { request } from "../../../../../utils";
import type { TeamType } from "../createTeam/service";

export const createArticle = async (params: {
  doc: ArticleType;
  team?: TeamType;
}): Promise<resType> => {
  return await request.post("/article/save", params);
};
