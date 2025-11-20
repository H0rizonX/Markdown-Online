import type { resType } from "../../../../../types/common";
import { request } from "../../../../../utils";

export const delDocs = async (params: {
  id: number;
  authorId: number;
}): Promise<resType> => {
  return await request.delete(
    `/article/delete/${params.id}?userId=${params.authorId}`
  );
};
