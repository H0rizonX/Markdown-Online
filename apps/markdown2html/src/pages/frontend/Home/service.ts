import type { resType } from "../../../types/common";
import { request } from "../../../utils";
import type { articleType } from "./interface";

// 获取所有文章列表
export const getAllArticles = async (params: articleType): Promise<resType> => {
  return await request.post("/article", params);
};
