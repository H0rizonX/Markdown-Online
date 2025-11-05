import { type FC, useRef, useState, useEffect, useMemo } from "react";
import type { componentProps } from "../../interface";
import { BookOpenCheck, Timer, Users } from "lucide-react";
import { Tooltip } from "antd";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

const TopBar: FC<componentProps> = ({ isExpended, file }) => {
  const MAX_LENGTH = 20;
  const [showTooltip, setShowTooltip] = useState(false);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  // 配置：默认连接 ws://<host>:3004，房间可来自文件路径/ID（默认 topbar-title）
  const DEFAULT_SERVER = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:3004`;
  const win = window as unknown as { VITE_YJS_WS_SERVER?: string; VITE_YJS_WS_ROOM?: string };
  const SERVER = win.VITE_YJS_WS_SERVER || DEFAULT_SERVER;
  const ROOM = win.VITE_YJS_WS_ROOM || (file?.path || "topbar-title");

  const { ydoc, ytext } = useMemo(() => {
    const doc = new Y.Doc();
    const text = doc.getText("title");
    return { ydoc: doc, ytext: text };
  }, []);

  const handleBeforeInput = (e: React.FormEvent<HTMLHeadingElement>) => {
    const element = e.currentTarget;
    const selection = window.getSelection();
    const selectedTextLength = selection?.toString().length ?? 0;
    const incomingLength = (e as unknown as InputEvent).data?.length ?? 0;
    const newLength =
      element.innerText.length - selectedTextLength + incomingLength;

    if (newLength > MAX_LENGTH) {
      e.preventDefault();
      showLimitTooltip();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLHeadingElement>) => {
    const pasteData = e.clipboardData.getData("text");
    const currentText = headingRef.current?.innerText || "";
    const selection = window.getSelection();
    const selectedLength = selection?.toString().length ?? 0;
    const finalLength = currentText.length - selectedLength + pasteData.length;

    if (finalLength > MAX_LENGTH) {
      e.preventDefault();
      showLimitTooltip();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {
    const element = headingRef.current;
    const selection = window.getSelection();
    const selectedLength = selection?.toString().length ?? 0;
    const currentLength = element?.innerText.length ?? 0;

    // 允许删除、方向键、复制粘贴等控制键
    if (
      [
        "Backspace",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
      ].includes(e.key)
    ) {
      return;
    }

    if (currentLength - selectedLength >= MAX_LENGTH) {
      e.preventDefault();
      showLimitTooltip();
    }
  };

  const showLimitTooltip = () => {
    setShowTooltip(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowTooltip(false), 2000);
  };

  // 连接 y-websocket，并将 Y.Text<"title"> 与 h1 同步
  useEffect(() => {
    const globalKey = `__YWS__${SERVER}__${ROOM}`;
    const cache = window as unknown as Record<string, unknown>;
    let provider = cache[globalKey] as WebsocketProvider | undefined;
    if (!provider) {
      provider = new WebsocketProvider(SERVER, String(ROOM), ydoc);
      cache[globalKey] = provider;
    }
    providerRef.current = provider;

    // 初始化：若远端为空则用现有 file?.title；否则渲染远端内容
    const ensureInitial = () => {
      const current = ytext.toString();
      const initial = (file?.title ?? "").slice(0, MAX_LENGTH);
      if (!current && initial) {
        ytext.insert(0, initial);
      }
      const t = ytext.toString();
      if (headingRef.current && headingRef.current.innerText !== t) {
        headingRef.current.innerText = t;
      }
    };

    const observer = () => {
      const t = ytext.toString();
      if (headingRef.current && headingRef.current.innerText !== t) {
        headingRef.current.innerText = t;
      }
    };

    ensureInitial();
    ytext.observe(observer);

    return () => {
      try { ytext.unobserve(observer); } catch { /* noop */ }
    };
  }, [SERVER, ROOM, ydoc, ytext, file?.title]);

  // 本地输入 -> Y.Text（限制 MAX_LENGTH）
  const handleInput = () => {
    const el = headingRef.current;
    if (!el) return;
    let next = (el.innerText || "").trim();
    if (next.length > MAX_LENGTH) {
      next = next.slice(0, MAX_LENGTH);
      el.innerText = next;
      showLimitTooltip();
    }
    const cur = ytext.toString();
    if (cur === next) return;
    ytext.delete(0, cur.length);
    if (next) ytext.insert(0, next);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      className={`
        h-full px-10 mt-5 flex flex-row items-center justify-between
        transition-all duration-1000 ease-in-out
        border-b border-gray-300 bg-white
        ${isExpended ? "w-[1200px] -ml-[200px]" : "w-[1000px] ml-0"}
      `}
    >
      <div className="flex flex-col gap-2 relative">
        <Tooltip
          title={showTooltip ? "最多输入 20 个字符" : ""}
          placement="top"
        >
          <h1
            ref={headingRef}
            contentEditable
            suppressContentEditableWarning={true}
            spellCheck={true}
            aria-placeholder="请输入标题"
            className="text-3xl font-bold text-gray-900
              px-1 rounded
              focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50
              selection:bg-gray-300 selection:text-white
              cursor-text"
            onBeforeInput={handleBeforeInput}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
          onInput={handleInput}
          >
            {""}
          </h1>
        </Tooltip>

        <div className="text-sm text-gray-500 flex gap-6">
          <span className="inline-flex items-center gap-1">
            <Users className="w-4 h-4" />
            {file?.author} · 编辑
          </span>
          <span className="inline-flex items-center gap-1">
            <Timer className="w-4 h-4" />
            {file?.time} · 创建
          </span>
          <span className="text-sm text-gray-500">{file?.path}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 text-gray-400 text-sm">
        <BookOpenCheck className="w-4 h-4" />
        <span>2</span>
      </div>
    </div>
  );
};

export default TopBar;
