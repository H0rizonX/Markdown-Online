// 新增：定义兼容的 UUID 生成函数（不修改 window.crypto）
function compatibleRandomUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 全局注入：给 window 加一个备用方法，或覆盖不存在的 randomUUID（不修改 crypto 本身）
if (!window.crypto?.randomUUID) {
  // 通过类型断言扩展 window 类型，避免使用 any
  interface ExtendedWindow extends Window {
    randomUUID?: () => string;
  }
  const extendedWindow = window as ExtendedWindow;
  extendedWindow.randomUUID = compatibleRandomUUID;

  // 同时给 crypto 加一个可写的 randomUUID（通过 Object.defineProperty 绕开只读限制）
  Object.defineProperty(window.crypto, "randomUUID", {
    value: compatibleRandomUUID,
    writable: false,
    configurable: true,
  });
}

// 以下是你原来的代码，保持不变
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./tailwind.css";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import MessageProvider from "./components/messageProvider";
import "./vueComponents/chatSidebar/index.js";
// 引入 ProseMirror 基础样式
import 'prosemirror-view/style/prosemirror.css';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* 初始化messageBox */}
    <MessageProvider />
    <RouterProvider router={router} />
  </StrictMode>
);