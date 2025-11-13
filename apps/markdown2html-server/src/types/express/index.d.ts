// types/express/index.d.ts
import "express";
import { dataType } from "../common";

declare module "express" {
  interface Response {
    suc: <T = dataType>(
      data: T,
      code?: number,
      message?: string,
      status?: number
    ) => void;
    fail: (err: string | Error, code?: number, status?: number) => void;
  }
  interface Request {
    file?: multer.File; // 单文件上传
    files?: { [fieldname: string]: multer.File[] } | multer.File[]; // 多文件上传
  }
}
