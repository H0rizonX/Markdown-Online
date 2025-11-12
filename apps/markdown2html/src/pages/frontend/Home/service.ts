import type { resType } from "../../../types/common";
import { request } from "../../../utils";

// 获取所有文章列表
export const getDocuments = async (params: {
  authorId: number;
  type: string;
}): Promise<resType> => {
  return await request.get(
    `/article/getDocs?authorId=${params.authorId}&type=${params.type}`
  );
};
