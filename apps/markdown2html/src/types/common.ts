export type dataType = {
  token?: string;
};
export type resType = {
  data: dataType | string | Array<dataType>;
  code?: number;
  message?: string;
  status: number;
};
