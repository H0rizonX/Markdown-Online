import { message } from "antd";
import type { MessageInstance } from "antd/es/message/interface";

let messageApi: MessageInstance;

export const setMessageApi = (api: MessageInstance) => {
  messageApi = api;
};

// 在非 React 环境中安全调用
export const getMessageApi = () => {
  if (!messageApi) {
    console.warn(
      "⚠️ messageApi 未初始化，请在根组件中调用 setMessageApi 初始化。"
    );
    return message;
  }
  return messageApi;
};
