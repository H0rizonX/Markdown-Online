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
}
