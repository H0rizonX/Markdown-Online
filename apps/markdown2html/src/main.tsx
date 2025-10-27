import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./tailwind.css";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import MessageProvider from "./components/messageProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* 初始化messageBox */}
    <MessageProvider />
    <RouterProvider router={router} />
  </StrictMode>
);
