import "./index.scss";
import { useEffect, useMemo, useRef, useState, type FC } from "react";
import type { componentProps } from "../../interface.ts";
import { message } from "antd";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { keymap } from "prosemirror-keymap";
import { history } from "prosemirror-history";
import { ySyncPlugin, yCursorPlugin, yUndoPlugin, undo, redo } from "y-prosemirror";
import type { Awareness } from "y-protocols/awareness";

const Tiptap: FC<componentProps> = (props) => {
  const { isExpended } = props;
  const [messageApi, contextHolder] = message.useMessage();
  const [isSaving, setIsSaving] = useState(false);
  const editorHostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  // 服务器与房间：与 TopBar 一致，默认同房间，保证标题与正文同一个协作会话
  const DEFAULT_SERVER = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:3004`;
  const win = window as unknown as { VITE_YJS_WS_SERVER?: string; VITE_YJS_WS_ROOM?: string };
  const SERVER = win.VITE_YJS_WS_SERVER || DEFAULT_SERVER;
  const ROOM = win.VITE_YJS_WS_ROOM || (props.file?.path || "doc");

  // 通过全局键复用 provider（避免 StrictMode 双挂载、并保证多组件共享同一 Y.Doc）
  const yXml = useMemo(() => {
    const globalKey = `__YWS__${SERVER}__${ROOM}`;
    const cache = window as unknown as Record<string, unknown>;
    let provider = cache[globalKey] as WebsocketProvider | undefined;
    if (!provider) {
      const doc = new Y.Doc();
      provider = new WebsocketProvider(SERVER, String(ROOM), doc);
      cache[globalKey] = provider;
    }
    providerRef.current = provider;
    type ProviderWithDoc = WebsocketProvider & { doc: Y.Doc };
    const withDoc = provider as ProviderWithDoc;
    const doc: Y.Doc = withDoc.doc;
    const xml = doc.getXmlFragment("prosemirror");
    return xml;
  }, [SERVER, ROOM]);
  const saveData = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      messageApi.open({
        type: "success",
        content: "保存成功",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 初始化 ProseMirror 并绑定 y-prosemirror
  useEffect(() => {
    if (!editorHostRef.current) return;

    // 构建编辑器状态
    const state = EditorState.create({
      schema: basicSchema,
      plugins: [
        ySyncPlugin(yXml),
        yCursorPlugin((providerRef.current as unknown as { awareness: Awareness }).awareness),
        yUndoPlugin(),
        keymap({
          "Mod-z": undo,
          "Mod-y": redo,
          "Mod-Shift-z": redo,
        }),
        history(),
      ],
    });

    // 创建视图
    const view = new EditorView(editorHostRef.current, {
      state,
      attributes: {
        class: "pm-editor w-full h-full prose max-w-none focus:outline-none",
      },
    });
    viewRef.current = view;

    // 绑定全局保存快捷键
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveData();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      try { window.removeEventListener("keydown", handleKeyDown); } catch { /* noop */ }
      try { view.destroy(); } catch { /* noop */ }
      // 不主动断开 provider，供其他组件（如 TopBar）继续复用
    };
  }, [yXml]);

  return (
    <div
      className={`
        h-full px-10 mt-5 flex items-center justify-center transition-all duration-1000 ease-in-out
        ${isExpended ? "w-[1200px] -ml-[200px]" : "w-[1000px] ml-0"}
      `}
    >
      {contextHolder}
      <div className="w-full h-[70vh] border rounded shadow-inner overflow-auto p-4 bg-white" ref={editorHostRef} />
      {isSaving && (
        <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="mt-2 text-gray-700 text-sm">正在保存中...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tiptap;
