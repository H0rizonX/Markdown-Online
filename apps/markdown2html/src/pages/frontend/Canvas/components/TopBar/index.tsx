import { type FC, useRef, useState, useEffect } from "react";
import type { componentProps } from "../../interface";
import { BookOpenCheck, Edit, Timer, Users, Upload, Download } from "lucide-react";
import { Dropdown, Button } from "antd";
import * as Y from "yjs";
import { handleImport, handleExport } from "../../../../../utils/importExport";

const TopBar: FC<componentProps> = ({ isExpended, file, ydoc, awareness, editor }) => {
  const [title, setTitle] = useState(file?.title || "");
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const isUpdatingFromYjs = useRef(false); // 防止循环更新
  const observerRef = useRef<(() => void) | null>(null); // 保存观察器函数引用

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
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

  // 初始化 Yjs 标题同步
  useEffect(() => {
    if (!ydoc) return;

    // 清理旧的观察器
    if (observerRef.current && ytextRef.current) {
      ytextRef.current.unobserve(observerRef.current);
      observerRef.current = null;
    }

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
      // 如果 Yjs 中没有标题，则使用当前文件标题进行初始化
      ytext.insert(0, file.title);
      setTitle(file.title);
      if (inputRef.current) {
        inputRef.current.value = file.title;
      }
    } else {
      // 两者都没有时清空
      setTitle("");
      if (inputRef.current) {
        inputRef.current.value = "";
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

    // 保存观察器函数引用
    observerRef.current = updateTitle;
    ytext.observe(updateTitle);

    return () => {
      if (observerRef.current && ytextRef.current) {
        ytextRef.current.unobserve(observerRef.current);
        observerRef.current = null;
      }
    };
  }, [ydoc, file?.id]); // 使用 file?.id 而不是 file?.title，确保文件切换时重新初始化

  // 监听在线用户数量
  useEffect(() => {
    if (!awareness) return;

    const updateOnlineUsers = () => {
      const states = awareness.getStates();
      const uniqueIds = new Set<number>();
      states.forEach((state) => {
        const userId = state?.user?.userId;
        if (typeof userId === "number") {
          uniqueIds.add(userId);
        }
      });
      const fallbackCount = states.size;
      setOnlineUsersCount(uniqueIds.size > 0 ? uniqueIds.size : fallbackCount);
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
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={handleInput}
          placeholder="请输入标题"
          className="text-3xl font-bold text-gray-900
            px-1 rounded border-none outline-none
            focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50
            bg-transparent w-full"
          spellCheck={true}
        />

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

      <div className="flex items-center gap-4">
        {/* 导入导出按钮组 */}
        {editor && (
          <div className="flex items-center gap-2">
            {/* 导入下拉菜单 */}
            <Dropdown
              menu={{
                items: [
                  {
                    key: "import-md",
                    label: "导入 Markdown",
                    icon: <Upload className="w-4 h-4" />,
                    onClick: () => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = ".md,.markdown,.txt";
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          try {
                            await handleImport(file, "markdown", editor);
                          } catch (error) {
                            console.error("导入失败:", error);
                          }
                        }
                      };
                      input.click();
                    },
                  },
                  {
                    key: "import-pdf",
                    label: "导入 PDF",
                    icon: <Upload className="w-4 h-4" />,
                    onClick: () => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = ".pdf";
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          try {
                            await handleImport(file, "pdf", editor);
                          } catch (error) {
                            console.error("导入失败:", error);
                          }
                        }
                      };
                      input.click();
                    },
                  },
                ],
              }}
              trigger={["click"]}
            >
              <Button
                type="default"
                icon={<Upload className="w-4 h-4" />}
                size="small"
              >
                导入
              </Button>
            </Dropdown>

            {/* 导出下拉菜单 */}
            <Dropdown
              menu={{
                items: [
                  {
                    key: "export-md",
                    label: "导出为 Markdown",
                    icon: <Download className="w-4 h-4" />,
                    onClick: async () => {
                      if (!editor) return;
                      try {
                        const filename = file?.title
                          ? `${file.title}.md`
                          : undefined;
                        await handleExport("markdown", editor, filename);
                      } catch (error) {
                        console.error("导出失败:", error);
                      }
                    },
                  },
                  {
                    key: "export-html",
                    label: "导出为 HTML",
                    icon: <Download className="w-4 h-4" />,
                    onClick: async () => {
                      if (!editor) return;
                      try {
                        const filename = file?.title
                          ? `${file.title}.html`
                          : undefined;
                        await handleExport("html", editor, filename);
                      } catch (error) {
                        console.error("导出失败:", error);
                      }
                    },
                  },
                  {
                    key: "export-pdf",
                    label: "导出为 PDF",
                    icon: <Download className="w-4 h-4" />,
                    onClick: async () => {
                      if (!editor) return;
                      try {
                        const filename = file?.title
                          ? `${file.title}.pdf`
                          : undefined;
                        await handleExport("pdf", editor, filename);
                      } catch (error) {
                        console.error("导出失败:", error);
                      }
                    },
                  },
                ],
              }}
              trigger={["click"]}
            >
              <Button
                type="primary"
                icon={<Download className="w-4 h-4" />}
                size="small"
              >
                导出
              </Button>
            </Dropdown>
          </div>
        )}

        {/* 在线用户数 */}
        <div className="flex items-center justify-center gap-1 text-gray-400 text-sm">
          <BookOpenCheck className="w-4 h-4" />
          <span>{onlineUsersCount || 1}</span>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
