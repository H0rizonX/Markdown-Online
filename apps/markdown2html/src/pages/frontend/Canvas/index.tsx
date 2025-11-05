import { useState, type FC } from "react";
import Tiptap from "./components/Tiptap";
import Menu from "./components/Menu";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import type { CanvasProps } from "./interface";

export const Canvas: FC<CanvasProps> = ({ file, onClose }) => {
  const [isExpended, setIsExpended] = useState(false);

  return (
    <div className="flex flex-col w-full h-full relative overflow-hidden">
      <div className="h-16 flex items-center justify-center">
        <TopBar isExpended={isExpended} file={file} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 h-full">
          <Menu
            isExpended={isExpended}
            setIsExpended={setIsExpended}
            onClose={onClose}
          />
        </div>

        <div className="flex-1 flex items-center justify-center overflow-hidden -ml-64">
          <Tiptap isExpended={isExpended} />
        </div>
        <div className="w-64 h-full absolute right-0 top-0 border-l bg-white shadow-md overflow-hidden">
          <Sidebar />
        </div>
      </div>
      {/* 挂载自定义元素（Vue Web Component），组件自身会贴边并可折叠 */}
      <chat-sidebar></chat-sidebar>
    </div>
  );
};
