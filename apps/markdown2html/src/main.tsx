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
