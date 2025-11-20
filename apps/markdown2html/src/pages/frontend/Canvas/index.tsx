import { useState, useMemo, useEffect, type FC } from "react";
import Tiptap from "./components/Tiptap";
import Menu from "./components/Menu";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import type { CanvasProps } from "./interface";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

// 配置：默认连接 ws://<host>:3004，房间 demo（可用 window.VITE_YJS_WS_SERVER 覆盖）
const DEFAULT_SERVER = `${location.protocol === "https:" ? "wss" : "ws"}://${location.hostname}:3004`;
const win = window as unknown as {
  VITE_YJS_WS_SERVER?: string;
  VITE_YJS_WS_ROOM?: string;
};
const SERVER = win.VITE_YJS_WS_SERVER || DEFAULT_SERVER;

export const Canvas: FC<CanvasProps> = ({ file, onClose, onSelectDoc }) => {
  const [isExpended, setIsExpended] = useState(false);

  const [currentFile, setCurrentFile] = useState(file);

  useEffect(() => {
    setCurrentFile(file);
  }, [file]);

  // 使用文件 path 作为房间名，确保每个文档有独立的协同空间
  const ROOM = String(currentFile?.id) || "default";
  // 创建共享的 Yjs 文档和 WebSocket Provider（供标题和内容使用）
  const { ydoc, provider, awareness } = useMemo(() => {
    // 使用文件 path 作为全局 key，确保每个文档有独立的 Provider 和 Doc
    const globalKey = `__YWS__${SERVER}__${ROOM}`;
    const docKey = `__YDOC__${ROOM}`;
    const cache = window as unknown as Record<string, unknown>;

    // 先检查是否已有 doc（确保内容不丢失）
    let doc = cache[docKey] as Y.Doc | undefined;
    if (!doc) {
      doc = new Y.Doc();
      cache[docKey] = doc;
    }

    // 检查是否已有 Provider
    let wsProvider = cache[globalKey] as WebsocketProvider | undefined;

    if (!wsProvider) {
      wsProvider = new WebsocketProvider(SERVER, ROOM, doc);
      cache[globalKey] = wsProvider;
    } else {
      // 如果 Provider 已存在，确保它使用的是同一个 doc
      const providerDoc = (wsProvider as unknown as { doc?: Y.Doc }).doc;
      if (providerDoc && providerDoc !== doc) {
        // Provider 使用的 doc 不同，需要重新创建 Provider
        // 但先保存当前 doc 的内容（如果需要）
        wsProvider.destroy();
        wsProvider = new WebsocketProvider(SERVER, ROOM, doc);
        cache[globalKey] = wsProvider;
      }
    }

    return { ydoc: doc, provider: wsProvider, awareness: wsProvider.awareness };
  }, [ROOM]);

  // 组件挂载时连接，卸载时断开
  useEffect(() => {
    if (!provider) return;

    // 连接
    try {
      provider.connect();
      console.info("[Canvas] 已连接到协同服务器");
    } catch (error) {
      console.error("[Canvas] 连接失败:", error);
    }

    // 组件卸载时断开连接
    return () => {
      try {
        provider.disconnect();
        console.info("[Canvas] 已断开协同服务器连接");
      } catch (error) {
        console.error("[Canvas] 断开连接失败:", error);
      }
    };
  }, [provider]);

  return (
    <div className="flex flex-col w-full h-full relative overflow-hidden">
      <div className="h-16 flex items-center justify-center">
        <TopBar
          isExpended={isExpended}
          file={file}
          ydoc={ydoc}
          awareness={awareness}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 h-full">
          <Menu
            isExpended={isExpended}
            setIsExpended={setIsExpended}
            onClose={onClose}
            onSelectDoc={(doc) => {
              onSelectDoc?.(doc); // 切换当前文档
            }}
          />
        </div>

        <div className="flex-1 flex items-center justify-center overflow-hidden -ml-64">
          <Tiptap
            isExpended={isExpended}
            ydoc={ydoc}
            provider={provider}
            awareness={awareness}
          />
        </div>
        <div className="w-64 h-full absolute right-0 top-0 border-l bg-white shadow-md overflow-hidden">
          <Sidebar />
        </div>
      </div>
      {/* 挂载自定义元素（Vue Web Component），组件自身会贴边并可折叠 */}
      <chat-sidebar room={ROOM}></chat-sidebar>
    </div>
  );
};
