import { type FC, useRef, useState, useEffect } from "react";
import type { componentProps } from "../../interface";
import { BookOpenCheck, Edit, Timer, Users } from "lucide-react";
import { Tooltip } from "antd";
import * as Y from "yjs";

const TopBar: FC<componentProps> = ({ isExpended, file, ydoc, awareness }) => {
  const MAX_LENGTH = 20;
  const [showTooltip, setShowTooltip] = useState(false);
  const [title, setTitle] = useState(file?.title || "");
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const isUpdatingFromYjs = useRef(false); // 防止循环更新

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (newValue.length > MAX_LENGTH) {
      e.target.value = title; // 恢复原值
      showLimitTooltip();
      return;
    }

    setTitle(newValue);

    // 同步到 Yjs（如果不是来自 Yjs 的更新）
    if (!isUpdatingFromYjs.current && ytextRef.current) {
      const currentYjsText = ytextRef.current.toString();
      if (currentYjsText !== newValue) {
        // 计算差异并更新 Yjs
        ytextRef.current.delete(0, currentYjsText.length);
        ytextRef.current.insert(0, newValue);
      }
    }
  };

  const showLimitTooltip = () => {
    setShowTooltip(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowTooltip(false), 2000);
  };

  // 初始化 Yjs 标题同步
  useEffect(() => {
    if (!ydoc) return;

    const ytext = ydoc.getText("title");
    ytextRef.current = ytext;

    // 从 Yjs 读取初始标题
    const currentTitle = ytext.toString();
    if (currentTitle) {
      // Yjs 中已有标题，使用它
      setTitle(currentTitle);
      if (inputRef.current) {
        inputRef.current.value = currentTitle;
      }
    } else if (file?.title) {
      // 如果 Yjs 中没有标题，且当前标题为空，才初始化
      const inputValue = inputRef.current?.value || "";
      if (!inputValue && file.title) {
        ytext.insert(0, file.title);
        setTitle(file.title);
        if (inputRef.current) {
          inputRef.current.value = file.title;
        }
      }
    }

    // 监听 Yjs 标题变化
    const updateTitle = () => {
      const newTitle = ytext.toString();
      if (inputRef.current && inputRef.current.value !== newTitle) {
        // 保存当前光标位置
        const cursorPos = inputRef.current.selectionStart || 0;
        const oldValue = inputRef.current.value;

        isUpdatingFromYjs.current = true;
        setTitle(newTitle);
        inputRef.current.value = newTitle;

        // 恢复光标位置（如果内容长度变化，调整位置）
        setTimeout(() => {
          if (inputRef.current) {
            const newLen = inputRef.current.value.length;
            const oldLen = oldValue.length;
            // 如果内容变短了，光标位置不能超过新长度
            const newCursorPos = Math.min(cursorPos, newLen);
            // 如果内容变长了，保持相对位置
            const adjustedPos =
              oldLen > 0 ? Math.min(newCursorPos, newLen) : newLen;
            inputRef.current.setSelectionRange(adjustedPos, adjustedPos);
          }
          isUpdatingFromYjs.current = false;
        }, 0);
      }
    };

    ytext.observe(updateTitle);

    return () => {
      ytext.unobserve(updateTitle);
    };
  }, [ydoc, file?.title]);

  // 监听在线用户数量
  useEffect(() => {
    if (!awareness) return;

    const updateOnlineUsers = () => {
      const states = awareness.getStates();
      setOnlineUsersCount(states.size);
    };

    awareness.on("change", updateOnlineUsers);
    updateOnlineUsers(); // 初始更新

    return () => {
      try {
        awareness.off("change", updateOnlineUsers);
      } catch {
        // noop
      }
    };
  }, [awareness]);

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
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={handleInput}
            maxLength={MAX_LENGTH}
            placeholder="请输入标题"
            className="text-3xl font-bold text-gray-900
              px-1 rounded border-none outline-none
              focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50
              bg-transparent w-full"
            spellCheck={true}
          />
        </Tooltip>

        <div className="text-sm text-gray-500 flex gap-6">
          <span className="inline-flex items-center gap-1">
            <Users className="w-4 h-4" />
            {file?.author.name} · 编辑
          </span>
          <span className="inline-flex items-center gap-1">
            <Timer className="w-4 h-4" />
            {file?.createdAt
              ? new Date(file.createdAt).toLocaleString("zh-CN", {
                  year: "2-digit",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "未知时间"}{" "}
            · 创建
          </span>
          <span className="inline-flex items-center gap-1">
            <Edit className="w-4 h-4" />
            {file?.updatedAt
              ? new Date(file.updatedAt).toLocaleString("zh-CN", {
                  year: "2-digit",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "未知时间"}{" "}
            · 修改
          </span>
          {file?.team && (
            <span className="text-sm text-gray-500">{file?.team.name}</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 text-gray-400 text-sm">
        <BookOpenCheck className="w-4 h-4" />
        <span>{onlineUsersCount || 1}</span>
      </div>
    </div>
  );
};

export default TopBar;
