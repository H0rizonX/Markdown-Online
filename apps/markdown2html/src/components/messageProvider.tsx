import React from "react";
import { message } from "antd";
import { setMessageApi } from "../utils";

/**
 * MessageProvider
 *
 * 用于初始化 Ant Design 的全局 message 实例。
 * 必须在 <App> 组件内部挂载一次。
 */
const MessageProvider: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();

  // 初始化全局 messageApi
  React.useEffect(() => {
    setMessageApi(messageApi);
  }, [messageApi]);

  // 必须返回 contextHolder，否则 message 不会显示
  return <>{contextHolder}</>;
};

export default MessageProvider;
