export type UserType = {
  id: number;
  name: string;
  email: string;
  avatar: string;
  phone?: string;
};

export type ArticleType = {
  id?: number;
  title: string;
  authorId: number;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
  visibility?: "team" | "personal";
  structure?: Record<string, unknown> | null;
  teamId?: number;
  tags?: string[];
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
