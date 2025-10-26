import { type FC, useRef, useState, useEffect } from "react";
import type { componentProps } from "../../interface";
import { BookOpenCheck, Timer, Users } from "lucide-react";
import { Tooltip } from "antd";

const TopBar: FC<componentProps> = ({ isExpended, file }) => {
  const MAX_LENGTH = 20;
  const [showTooltip, setShowTooltip] = useState(false);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
          >
            {file?.title}
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
