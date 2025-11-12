import type { resType, UserType } from "../../../types/common";
import { request } from "../../../utils";

export const uploadAvatar = async (file: File): Promise<resType> => {
  const formData = new FormData();
  formData.append("file", file);
  return await request.post("/users/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const updateUserInfo = async (params: UserType): Promise<resType> => {
  return await request.post(`/users/update/${params.id}`, params);
};
