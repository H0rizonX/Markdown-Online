export type UserType = {
  id: number;
  name: string;
  email: string;
  avatar: string;
};
export type dataType = {
  token?: string;
  user?: UserType;
};
export type resType = {
  data: dataType | string | Array<dataType>;
  code?: number;
  message?: string;
  status: number;
};
