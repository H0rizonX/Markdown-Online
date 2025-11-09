import { useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

// 配置：默认连接 ws://<host>:3004，房间 demo（可用 window.VITE_YJS_WS_SERVER 覆盖）
const DEFAULT_SERVER = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:3004`;
const win = window as unknown as { VITE_YJS_WS_SERVER?: string; VITE_YJS_WS_ROOM?: string };
const SERVER = win.VITE_YJS_WS_SERVER || DEFAULT_SERVER;
const ROOM = win.VITE_YJS_WS_ROOM || "demo";

export default function CollabDemo() {
  const [connected, setConnected] = useState(false);
  const [length, setLength] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  const { ydoc, ytext } = useMemo(() => {
    const doc = new Y.Doc();
    const text = doc.getText("content");
    return { ydoc: doc, ytext: text };
  }, []);

  useEffect(() => {
    // 避免 React StrictMode 下的双挂载造成早关闭报错：复用全局 Provider
    const globalKey = `__YWS__${SERVER}__${ROOM}`;
    const cache = window as unknown as Record<string, unknown>;
    let provider = cache[globalKey] as WebsocketProvider | undefined;
    if (!provider) {
      provider = new WebsocketProvider(SERVER, ROOM, ydoc);
      cache[globalKey] = provider;
    }
    providerRef.current = provider;

    const onStatus = (ev: { status: 'connected' | 'disconnected' | 'connecting' }) => { setConnected(ev.status === 'connected'); console.info('[yjs] status', ev); };
    provider.on('status', onStatus);
    // 如果当前未连接，尝试发起连接
    try { if (!(provider as unknown as { connected?: boolean }).connected) provider.connect(); } catch { /* noop */ }

    const textObserver = () => {
      const t = ytext.toString();
      if (textareaRef.current && textareaRef.current.value !== t) {
        textareaRef.current.value = t;
      }
      setLength(t.length);
    };
    ytext.observe(textObserver);

    return () => {
      try { ytext.unobserve(textObserver); } catch { /* noop */ }
      try { provider.off('status', onStatus); } catch { /* noop */ }
      // 不销毁全局实例，避免 StrictMode 早关闭导致的控制台报错
    };
  }, [SERVER, ROOM, ydoc, ytext]);

  // 输入框 -> Y.Text
  const onInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    const cur = ytext.toString();
    const next = el.value;
    if (cur === next) return;
    ytext.delete(0, cur.length);
    ytext.insert(0, next);
  };

  return (
    <div className="w-full h-full flex flex-col items-center p-6 gap-3">
      <div className="text-sm text-gray-600">Yjs 连接：{connected ? "已连接" : "未连接"} · 文本长度：{length}</div>
      <textarea
        ref={textareaRef}
        onInput={onInput}
        placeholder="在这里输入文字，打开第二个标签页访问相同路径以验证同步"
        className="w-full max-w-3xl h-[50vh] p-3 border rounded outline-none focus:ring"
      />
    </div>
  );
}


