import axios from "axios";
import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { getMessageApi } from "./globalMessage";
import { useTokenStore } from "../store/token";

// 全局message提示
const msgBox = getMessageApi();
import type { resType } from "../types/common";
// 新增：引入全局提示
import { message } from "antd";
// 创建实例
const request: AxiosInstance = axios.create({
  baseURL: "/api",
  timeout: 5000,
});

// 请求拦截器
request.interceptors.request.use(
  function (config: InternalAxiosRequestConfig) {
    const token = useTokenStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = token;
    }
    return config;
  },
  function (error: AxiosError) {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  function <T = resType>(response: AxiosResponse): Promise<AxiosResponse<T>> {
    // if (response.status !== 200) {
    //   message.error(
    //     response.data?.message || `请求错误，状态码：${response.status}`
    //   );
    //   return Promise.reject(response);
    // }

    // 展示该信息
    if (response.data.status === 1) msgBox.success(response.data.message);

    return Promise.resolve(response.data as AxiosResponse<T>);
  },
  function (error: AxiosError<resType>) {
    message.error(error.response?.data?.message || error.message || "请求出错");
    return Promise.reject(error);
  }
);

export default request;
