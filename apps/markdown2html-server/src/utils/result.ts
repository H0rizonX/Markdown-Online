/**
 * 通用响应方法
 *
 * @param {number} status 返回状态 0 成功 1 失败
 * @param {number} display 客户端是否展示 0 展示 1 不展示
 * @return {null} 直接发送数据
 */
import { Request, Response, NextFunction } from "express";
import { dataType } from "../types/common";

function result(req: Request, res: Response, next: NextFunction) {
  res.suc = function <T = dataType>(
    data: T,
    code = 200,
    message = "操作成功",
    status = 0
  ) {
    res.status(code).json({ code, message, data, status });
  };

  res.fail = function (err: string | Error, code = 200, status = 1) {
    const message = err instanceof Error ? err.message : err;
    res.status(code).json({ code, message, data: null, status });
  };

  next();
}

export default result;
