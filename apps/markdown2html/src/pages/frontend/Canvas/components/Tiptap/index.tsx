import "./index.scss";
import { useEffect, useMemo, useRef, useState, type FC } from "react";
import type { componentProps } from "../../interface.ts";
import { message, Button, Avatar, Badge, Input, Modal, Dropdown } from "antd";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import css from "highlight.js/lib/languages/css";
import html from "highlight.js/lib/languages/xml";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";
import java from "highlight.js/lib/languages/java";
import cpp from "highlight.js/lib/languages/cpp";
import bash from "highlight.js/lib/languages/bash";
import markdown from "highlight.js/lib/languages/markdown";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Users,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  CheckSquare,
  Minus,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Highlighter,
  Code2,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
} from "lucide-react";
import useUserStore from "../../../../../stores/user.ts";
import type { UserType } from "../../../../../types/common.ts";

// 配置：默认连接 ws://<host>:3004，房间 demo（可用 window.VITE_YJS_WS_SERVER 覆盖）
const DEFAULT_SERVER = `${location.protocol === "https:" ? "wss" : "ws"}://${location.hostname}:3004`;
const win = window as unknown as {
  VITE_YJS_WS_SERVER?: string;
  VITE_YJS_WS_ROOM?: string;
};
const SERVER = win.VITE_YJS_WS_SERVER || DEFAULT_SERVER;
const ROOM = win.VITE_YJS_WS_ROOM || "default";

// 根据用户ID生成稳定的颜色
const COLORS = [
  "#958DF1",
  "#F98181",
  "#FBBC88",
  "#FAF594",
  "#70CFF8",
  "#94FADB",
  "#B9F18D",
  "#C2D5FF",
  "#FFD5E5",
  "#FFD93D",
];

function getUserColor(userId: number): string {
  return COLORS[userId % COLORS.length];
}

// 获取或创建用户信息（基于登录用户）
function getCollaborationUser(userInfo: UserType) {
  const loggedInUser = userInfo;

  if (loggedInUser) {
    // 使用登录用户信息
    return {
      name: loggedInUser.name,
      color: getUserColor(loggedInUser.id),
      userId: loggedInUser.id,
      email: loggedInUser.email,
      avatar: loggedInUser.avatar,
    };
  }

  // 如果没有登录，使用临时用户（基于 localStorage）
  const TEMP_USER_KEY = "collab_temp_user";
  let tempUser = localStorage.getItem(TEMP_USER_KEY);

  if (!tempUser) {
    const tempId = Date.now();
    tempUser = JSON.stringify({
      id: tempId,
      name: `用户${tempId.toString().slice(-4)}`,
      color: getUserColor(tempId),
    });
    localStorage.setItem(TEMP_USER_KEY, tempUser);
  }

  const parsed = JSON.parse(tempUser);
  return {
    name: parsed.name,
    color: parsed.color,
    userId: parsed.id,
    email: "",
    avatar: "",
  };
}

// 在线用户类型
interface OnlineUser {
  clientId: number;
  name: string;
  color: string;
  userId?: number;
  avatar?: string;
}

// 正在编辑的用户类型
interface EditingUser {
  clientId: number;
  name: string;
  color: string;
  avatar?: string;
  lastEditTime: number;
  position?: { top: number; left: number };
  isSelf?: boolean;
}

// 创建 lowlight 实例用于代码高亮，并注册常用语言
const lowlight = createLowlight();
lowlight.register("javascript", javascript);
lowlight.register("typescript", typescript);
lowlight.register("css", css);
lowlight.register("html", html);
lowlight.register("xml", html);
lowlight.register("json", json);
lowlight.register("python", python);
lowlight.register("java", java);
lowlight.register("cpp", cpp);
lowlight.register("c", cpp);
lowlight.register("bash", bash);
lowlight.register("shell", bash);
lowlight.register("markdown", markdown);

const Tiptap: FC<componentProps> = (props) => {
  const {
    isExpended,
    ydoc: externalYdoc,
    provider: externalProvider,
    awareness: externalAwareness,
  } = props;
  const [messageApi, contextHolder] = message.useMessage();
  const [isSaving, setIsSaving] = useState(false);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [editingUsers, setEditingUsers] = useState<EditingUser[]>([]);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const providerRef = useRef<WebsocketProvider | null>(null);
  const { userInfo } = useUserStore();
  const userRef = useRef(getCollaborationUser(userInfo!));
  const editingTimeoutRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  // 使用外部传入的 Yjs 资源，如果没有则创建新的
  const { ydoc, provider, awareness } = useMemo(() => {
    if (externalYdoc && externalProvider && externalAwareness) {
      return {
        ydoc: externalYdoc,
        provider: externalProvider,
        awareness: externalAwareness,
      };
    }

    const doc = new Y.Doc();
    const globalKey = `__YWS__${SERVER}__${ROOM}`;
    const cache = window as unknown as Record<string, unknown>;
    let wsProvider = cache[globalKey] as WebsocketProvider | undefined;

    if (!wsProvider) {
      wsProvider = new WebsocketProvider(SERVER, ROOM, doc);
      cache[globalKey] = wsProvider;
    }

    return { ydoc: doc, provider: wsProvider, awareness: wsProvider.awareness };
  }, [externalYdoc, externalProvider, externalAwareness]);

  providerRef.current = provider;

  // 创建 Tiptap 编辑器
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // 禁用 undoRedo，因为 Collaboration 扩展自带历史支持
        undoRedo: false,
        codeBlock: false, // 使用带高亮的代码块
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "max-w-full h-auto",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse",
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      HorizontalRule,
      Underline,
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: "",
    editable: true,
    editorProps: {
      attributes: {
        class: "tiptap ProseMirror",
        "data-placeholder": "开始输入...",
      },
    },
  });

  // 设置用户 awareness 信息并追踪编辑状态
  useEffect(() => {
    if (!awareness) return;

    // 设置当前用户信息到 awareness
    awareness.setLocalStateField("user", {
      name: userRef.current.name,
      color: userRef.current.color,
      userId: userRef.current.userId,
      email: userRef.current.email,
      avatar: userRef.current.avatar,
    });

    // 监听 awareness 变化（在线用户变化和编辑状态）
    const updateOnlineUsers = () => {
      const states = awareness.getStates();
      const userMap = new Map<number | string, OnlineUser>();
      const editingCandidates: EditingUser[] = [];
      const currentClientId = (awareness as unknown as { clientID?: number })
        .clientID;

      states.forEach((state, clientId) => {
        if (!state.user) return;
        const clientIdNum = Number(clientId);
        const isSelf = clientIdNum === currentClientId;
        const userInfo: OnlineUser = {
          clientId: clientIdNum,
          name: state.user.name || "未知用户",
          color: state.user.color || "#958DF1",
          userId: state.user.userId,
          avatar: state.user.avatar,
        };
        const dedupeKey =
          typeof userInfo.userId === "number"
            ? userInfo.userId
            : `client-${clientIdNum}`;
        const existing = userMap.get(dedupeKey);
        if (!existing || isSelf) {
          userMap.set(dedupeKey, userInfo);
        }

        const isEditing = state.isEditing === true;
        if (isEditing) {
          if (!isSelf) {
            const existingTimeout = editingTimeoutRef.current.get(clientIdNum);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
            }
          }

          let position: { top: number; left: number } | undefined;
          if (!isSelf && editor && editor.view && state.selection) {
            try {
              const selection = state.selection as {
                anchor?: number;
                head?: number;
              };
              if (selection.anchor !== undefined) {
                const coords = editor.view.coordsAtPos(selection.anchor);
                if (coords) {
                  const containerRect =
                    editorContainerRef.current?.getBoundingClientRect();
                  if (containerRect) {
                    position = {
                      top: coords.top - containerRect.top + 20, // 在光标下方显示
                      left: coords.left - containerRect.left,
                    };
                  }
                }
              }
            } catch {
              // 如果获取位置失败，忽略
            }
          }

          editingCandidates.push({
            ...userInfo,
            lastEditTime: Date.now(),
            position,
            isSelf,
          });

          if (process.env.NODE_ENV === "development") {
            console.log(
              "[Tiptap] 检测到用户正在编辑:",
              userInfo.name,
              "clientId:",
              clientIdNum,
              "position:",
              position
            );
          }

          if (!isSelf) {
            const timeout = setTimeout(() => {
              setEditingUsers((prev) =>
                prev.filter((u) => u.clientId !== clientIdNum)
              );
              editingTimeoutRef.current.delete(clientIdNum);
            }, 3000);

            editingTimeoutRef.current.set(clientIdNum, timeout);
          }
        } else if (!isSelf) {
          const existingTimeout = editingTimeoutRef.current.get(clientIdNum);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            editingTimeoutRef.current.delete(clientIdNum);
          }
        }
      });

      setOnlineUsers(Array.from(userMap.values()));

      // 更新编辑用户列表
      setEditingUsers((prev) => {
        // 移除不再编辑的用户
        const stillEditing = prev.filter((u) => {
          const state = Array.from(states.entries()).find(
            ([id]) => Number(id) === u.clientId
          )?.[1];
          return state?.isEditing === true;
        });

        // 添加新的编辑用户
        const newEditing = editingCandidates.filter(
          (e) => !stillEditing.some((s) => s.clientId === e.clientId)
        );

        return [...stillEditing, ...newEditing];
      });
    };

    awareness.on("change", updateOnlineUsers);
    updateOnlineUsers(); // 初始更新

    return () => {
      try {
        awareness.off("change", updateOnlineUsers);
        // 清理所有超时
        editingTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
        editingTimeoutRef.current.clear();
      } catch {
        // noop
      }
    };
  }, [awareness]);

  // 追踪当前用户的编辑状态
  useEffect(() => {
    if (!editor || !awareness) return;

    let isEditing = false;
    let editingTimeout: NodeJS.Timeout | null = null;
    let isLocalOperation = false; // 标记是否是本地用户操作

    const setEditingState = (editing: boolean) => {
      if (isEditing === editing) return;
      isEditing = editing;

      if (editingTimeout) {
        clearTimeout(editingTimeout);
        editingTimeout = null;
      }

      // 立即更新 awareness 状态
      awareness.setLocalStateField("isEditing", editing);

      // 调试日志
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[Tiptap] 设置编辑状态:",
          editing,
          "用户:",
          userRef.current.name
        );
      }

      // 如果停止编辑，延迟清除状态
      if (!editing) {
        editingTimeout = setTimeout(() => {
          awareness.setLocalStateField("isEditing", false);
        }, 2000);
      }
    };

    const handleFocus = () => {
      // focus 时暂时不设置编辑状态，等待真正的输入
    };

    const handleBlur = () => {
      setEditingState(false);
      isLocalOperation = false;
    };

    // 只在本地操作时设置编辑状态
    const handleUpdate = () => {
      // 如果 update 事件是由协同同步触发的（isLocalOperation 为 false），不设置编辑状态
      if (!isLocalOperation) {
        return;
      }

      // 只有本地操作时才设置编辑状态
      setEditingState(true);

      // 同步光标位置到 awareness
      try {
        if (editor && editor.view && editor.view.state) {
          const { from } = editor.view.state.selection;
          awareness.setLocalStateField("selection", {
            anchor: from,
            head: from,
          });
        }
      } catch {
        // 编辑器视图可能还未就绪，忽略错误
      }

      // 每次输入时重置超时，延迟清除编辑状态
      if (editingTimeout) {
        clearTimeout(editingTimeout);
      }
      editingTimeout = setTimeout(() => {
        setEditingState(false);
        isLocalOperation = false;
      }, 1500);
    };

    // 监听光标移动（只有本地操作时才更新）
    const handleSelectionUpdate = () => {
      if (isEditing && isLocalOperation) {
        try {
          if (editor && editor.view && editor.view.state) {
            const { from } = editor.view.state.selection;
            awareness.setLocalStateField("selection", {
              anchor: from,
              head: from,
            });
          }
        } catch {
          // 忽略错误
        }
      }
    };

    // 监听键盘输入（真正的用户操作）
    const handleKeyDown = () => {
      isLocalOperation = true;
      setEditingState(true);

      // 同步光标位置
      try {
        if (editor && editor.view && editor.view.state) {
          const { from } = editor.view.state.selection;
          awareness.setLocalStateField("selection", {
            anchor: from,
            head: from,
          });
        }
      } catch {
        // 忽略错误
      }

      // 重置超时
      if (editingTimeout) {
        clearTimeout(editingTimeout);
      }
      editingTimeout = setTimeout(() => {
        setEditingState(false);
        isLocalOperation = false;
      }, 1500);
    };

    // 监听鼠标点击（可能是用户要开始编辑）
    const handleClick = () => {
      // 点击时暂时标记为本地操作，等待后续输入
      isLocalOperation = true;
    };

    editor.on("focus", handleFocus);
    editor.on("blur", handleBlur);
    editor.on("update", handleUpdate);
    editor.on("selectionUpdate", handleSelectionUpdate);

    // 等待编辑器视图创建后再添加 DOM 事件监听
    let editorElement: HTMLElement | null = null;
    const setupDOMListeners = () => {
      try {
        if (editor && editor.view && editor.view.dom && !editorElement) {
          editorElement = editor.view.dom;
          editorElement.addEventListener("keydown", handleKeyDown);
          editorElement.addEventListener("click", handleClick);
        }
      } catch {
        // 编辑器视图可能还未挂载，忽略错误
        console.warn("[Tiptap] 编辑器视图未就绪，稍后重试");
      }
    };

    // 使用 setTimeout 延迟检查，确保编辑器已挂载
    let retryCount = 0;
    const maxRetries = 10; // 最多重试10次（1秒）
    let retryTimeout: NodeJS.Timeout | null = null;
    const checkAndSetup = () => {
      try {
        if (editor && editor.view && editor.view.dom) {
          setupDOMListeners();
        } else if (retryCount < maxRetries) {
          // 如果还未就绪，稍后重试
          retryCount++;
          retryTimeout = setTimeout(checkAndSetup, 100);
        }
      } catch {
        // 如果出错，稍后重试（最多重试10次）
        if (retryCount < maxRetries) {
          retryCount++;
          retryTimeout = setTimeout(checkAndSetup, 100);
        }
      }
    };

    // 延迟检查，确保编辑器已挂载
    retryTimeout = setTimeout(checkAndSetup, 100);

    // 同时监听 create 事件作为备用
    const createHandler = () => {
      setupDOMListeners();
      editor.off("create", createHandler);
    };
    editor.on("create", createHandler);

    return () => {
      editor.off("focus", handleFocus);
      editor.off("blur", handleBlur);
      editor.off("update", handleUpdate);
      editor.off("selectionUpdate", handleSelectionUpdate);
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (editorElement) {
        editorElement.removeEventListener("keydown", handleKeyDown);
        editorElement.removeEventListener("click", handleClick);
      }
      if (editingTimeout) {
        clearTimeout(editingTimeout);
      }
      awareness.setLocalStateField("isEditing", false);
    };
  }, [editor, awareness]);

  // 定期更新编辑用户的光标位置
  useEffect(() => {
    if (!editor || !awareness || editingUsers.length === 0) return;

    const updatePositions = () => {
      const states = awareness.getStates();
      const currentClientId = (awareness as unknown as { clientID?: number })
        .clientID;

      setEditingUsers((prev) => {
        return prev.map((user) => {
          const state = Array.from(states.entries()).find(
            ([id]) => Number(id) === user.clientId
          )?.[1];
          if (!state || !state.isEditing || user.clientId === currentClientId) {
            return user;
          }

          // 更新位置
          let position: { top: number; left: number } | undefined;
          if (editor.view && state.selection) {
            try {
              const selection = state.selection as {
                anchor?: number;
                head?: number;
              };
              if (selection.anchor !== undefined) {
                const coords = editor.view.coordsAtPos(selection.anchor);
                if (coords) {
                  const containerRect =
                    editorContainerRef.current?.getBoundingClientRect();
                  if (containerRect) {
                    position = {
                      top: coords.top - containerRect.top + 20,
                      left: coords.left - containerRect.left,
                    };
                  }
                }
              }
            } catch {
              // 忽略错误
            }
          }

          return { ...user, position };
        });
      });
    };

    // 初始更新
    updatePositions();

    // 定期更新位置（每200ms）
    const interval = setInterval(updatePositions, 200);

    return () => {
      clearInterval(interval);
    };
  }, [editor, awareness, editingUsers.length]);

  // 监听连接状态
  useEffect(() => {
    if (!provider) return;

    const onStatus = (ev: {
      status: "connected" | "disconnected" | "connecting";
    }) => {
      setConnected(ev.status === "connected");
      if (ev.status === "connected") {
        console.info("[Tiptap] 已连接到协同服务器");
      } else if (ev.status === "disconnected") {
        console.warn("[Tiptap] 已断开连接");
      }
    };

    provider.on("status", onStatus);

    // 检查当前连接状态
    const checkStatus = () => {
      try {
        const isConnected = (provider as unknown as { connected?: boolean })
          .connected;
        if (isConnected !== undefined) {
          setConnected(isConnected);
        }
      } catch {
        // noop
      }
    };

    // 初始检查
    checkStatus();

    return () => {
      try {
        provider.off("status", onStatus);
      } catch {
        // noop
      }
    };
  }, [provider]);

  // 保存功能
  const saveData = async () => {
    if (!editor) return;

    setIsSaving(true);
    try {
      // 这里可以获取编辑器内容并保存
      const content = editor.getJSON();
      console.log("保存内容:", content);

      await new Promise((resolve) => setTimeout(resolve, 1500));
      messageApi.open({
        type: "success",
        content: "保存成功",
      });
    } catch {
      messageApi.open({
        type: "error",
        content: "保存失败",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 快捷键保存
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveData();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editor]);

  // 清理编辑器
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  // 插入链接
  const handleInsertLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    setLinkUrl(previousUrl || "");
    setLinkModalVisible(true);
  };

  const confirmLink = () => {
    if (!editor || !linkUrl.trim()) {
      messageApi.warning({ content: "请输入有效的链接地址" });
      return;
    }

    if (linkUrl.trim()) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl.trim() })
        .run();
    } else {
      editor.chain().focus().unsetLink().run();
    }

    setLinkModalVisible(false);
    setLinkUrl("");
  };

  // 插入图片
  const handleInsertImage = () => {
    setImageUrl("");
    setImageModalVisible(true);
  };

  const confirmImage = () => {
    if (!editor || !imageUrl.trim()) {
      messageApi.warning({ content: "请输入有效的图片地址" });
      return;
    }

    editor.chain().focus().setImage({ src: imageUrl.trim() }).run();
    setImageModalVisible(false);
    setImageUrl("");
  };

  // 插入表格
  const handleInsertTable = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  // 删除表格
  const handleDeleteTable = () => {
    if (!editor) return;
    editor.chain().focus().deleteTable().run();
  };

  // 添加表格行
  const handleAddRowBefore = () => {
    if (!editor) return;
    editor.chain().focus().addRowBefore().run();
  };

  const handleAddRowAfter = () => {
    if (!editor) return;
    editor.chain().focus().addRowAfter().run();
  };

  // 删除表格行
  const handleDeleteRow = () => {
    if (!editor) return;
    editor.chain().focus().deleteRow().run();
  };

  // 添加表格列
  const handleAddColumnBefore = () => {
    if (!editor) return;
    editor.chain().focus().addColumnBefore().run();
  };

  const handleAddColumnAfter = () => {
    if (!editor) return;
    editor.chain().focus().addColumnAfter().run();
  };

  // 删除表格列
  const handleDeleteColumn = () => {
    if (!editor) return;
    editor.chain().focus().deleteColumn().run();
  };

  // 设置文字颜色
  const handleSetColor = (color: string) => {
    if (!editor) return;
    editor.chain().focus().setColor(color).run();
  };

  // 设置高亮颜色
  const handleSetHighlight = (color: string) => {
    if (!editor) return;
    editor.chain().focus().toggleHighlight({ color }).run();
  };

  return (
    <div
      className={`
        h-full px-10 mt-5 flex flex-col transition-all duration-1000 ease-in-out
        ${isExpended ? "w-[1200px] -ml-[200px]" : "w-[1000px] ml-0"}
      `}
    >
      {contextHolder}

      {/* 状态栏 */}
      <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-3">
          <span className={connected ? "text-green-600" : "text-red-500"}>
            协同状态：{connected ? "已连接" : "未连接"}
          </span>
          <span className="text-gray-400">|</span>
          <span>当前用户：{userRef.current.name}</span>
          {/* 临时调试信息 */}
          {process.env.NODE_ENV === "development" && (
            <>
              <span className="text-gray-400">|</span>
              <span className="text-xs text-gray-400">
                编辑中: {editingUsers.length}
              </span>
            </>
          )}
        </div>

        {/* 在线用户列表 */}
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-gray-500">在线 ({onlineUsers.length})</span>
          <div className="flex items-center gap-1">
            {onlineUsers.map((user) => (
              <Badge
                key={user.userId ?? user.clientId}
                color={user.color}
                dot
                title={user.name}
              >
                <Avatar
                  size="small"
                  src={user.avatar}
                  style={{ backgroundColor: user.color }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* 编辑器容器 */}
      <div className="flex-1 border rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
        {/* 工具栏 */}
        {editor && (
          <div className="border-b border-gray-200 p-2 flex items-center gap-1 flex-wrap bg-gray-50">
            <Button
              type={editor.isActive("bold") ? "primary" : "default"}
              size="small"
              icon={<Bold className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="加粗 (Ctrl+B)"
            />
            <Button
              type={editor.isActive("italic") ? "primary" : "default"}
              size="small"
              icon={<Italic className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="斜体 (Ctrl+I)"
            />
            <Button
              type={editor.isActive("strike") ? "primary" : "default"}
              size="small"
              icon={<Strikethrough className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="删除线"
            />
            <Button
              type={editor.isActive("code") ? "primary" : "default"}
              size="small"
              icon={<Code className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleCode().run()}
              title="行内代码"
            />
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              type={
                editor.isActive("heading", { level: 1 }) ? "primary" : "default"
              }
              size="small"
              icon={<Heading1 className="w-4 h-4" />}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              title="标题 1"
            />
            <Button
              type={
                editor.isActive("heading", { level: 2 }) ? "primary" : "default"
              }
              size="small"
              icon={<Heading2 className="w-4 h-4" />}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              title="标题 2"
            />
            <Button
              type={
                editor.isActive("heading", { level: 3 }) ? "primary" : "default"
              }
              size="small"
              icon={<Heading3 className="w-4 h-4" />}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              title="标题 3"
            />
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              type={editor.isActive("bulletList") ? "primary" : "default"}
              size="small"
              icon={<List className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="无序列表"
            />
            <Button
              type={editor.isActive("orderedList") ? "primary" : "default"}
              size="small"
              icon={<ListOrdered className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="有序列表"
            />
            <Button
              type={editor.isActive("blockquote") ? "primary" : "default"}
              size="small"
              icon={<Quote className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              title="引用"
            />
            <Button
              type={editor.isActive("underline") ? "primary" : "default"}
              size="small"
              icon={<UnderlineIcon className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="下划线 (Ctrl+U)"
            />
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              type={editor.isActive("subscript") ? "primary" : "default"}
              size="small"
              icon={<SubscriptIcon className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleSubscript().run()}
              title="下标"
            />
            <Button
              type={editor.isActive("superscript") ? "primary" : "default"}
              size="small"
              icon={<SuperscriptIcon className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleSuperscript().run()}
              title="上标"
            />
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              type={editor.isActive("link") ? "primary" : "default"}
              size="small"
              icon={<LinkIcon className="w-4 h-4" />}
              onClick={handleInsertLink}
              title="插入链接 (Ctrl+K)"
            />
            <Button
              size="small"
              icon={<ImageIcon className="w-4 h-4" />}
              onClick={handleInsertImage}
              title="插入图片"
            />
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              type={editor.isActive("taskList") ? "primary" : "default"}
              size="small"
              icon={<CheckSquare className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              title="任务列表"
            />
            <Button
              size="small"
              icon={<Minus className="w-4 h-4" />}
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="水平分割线"
            />
            <Button
              type={editor.isActive("codeBlock") ? "primary" : "default"}
              size="small"
              icon={<Code2 className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              title="代码块"
            />
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Dropdown
              menu={{
                items: [
                  {
                    key: "left",
                    label: "左对齐",
                    icon: <AlignLeft className="w-4 h-4" />,
                    onClick: () =>
                      editor.chain().focus().setTextAlign("left").run(),
                  },
                  {
                    key: "center",
                    label: "居中",
                    icon: <AlignCenter className="w-4 h-4" />,
                    onClick: () =>
                      editor.chain().focus().setTextAlign("center").run(),
                  },
                  {
                    key: "right",
                    label: "右对齐",
                    icon: <AlignRight className="w-4 h-4" />,
                    onClick: () =>
                      editor.chain().focus().setTextAlign("right").run(),
                  },
                  {
                    key: "justify",
                    label: "两端对齐",
                    icon: <AlignJustify className="w-4 h-4" />,
                    onClick: () =>
                      editor.chain().focus().setTextAlign("justify").run(),
                  },
                ],
              }}
            >
              <Button
                size="small"
                icon={<AlignLeft className="w-4 h-4" />}
                title="文本对齐"
              />
            </Dropdown>
            <Dropdown
              menu={{
                items: [
                  {
                    key: "black",
                    label: <div className="w-6 h-6 bg-black rounded" />,
                    onClick: () => handleSetColor("#000000"),
                  },
                  {
                    key: "red",
                    label: <div className="w-6 h-6 bg-red-500 rounded" />,
                    onClick: () => handleSetColor("#ef4444"),
                  },
                  {
                    key: "blue",
                    label: <div className="w-6 h-6 bg-blue-500 rounded" />,
                    onClick: () => handleSetColor("#3b82f6"),
                  },
                  {
                    key: "green",
                    label: <div className="w-6 h-6 bg-green-500 rounded" />,
                    onClick: () => handleSetColor("#22c55e"),
                  },
                  {
                    key: "yellow",
                    label: <div className="w-6 h-6 bg-yellow-500 rounded" />,
                    onClick: () => handleSetColor("#eab308"),
                  },
                  {
                    key: "purple",
                    label: <div className="w-6 h-6 bg-purple-500 rounded" />,
                    onClick: () => handleSetColor("#a855f7"),
                  },
                  {
                    key: "orange",
                    label: <div className="w-6 h-6 bg-orange-500 rounded" />,
                    onClick: () => handleSetColor("#f97316"),
                  },
                  {
                    key: "gray",
                    label: <div className="w-6 h-6 bg-gray-500 rounded" />,
                    onClick: () => handleSetColor("#6b7280"),
                  },
                ],
              }}
            >
              <Button
                size="small"
                icon={<Palette className="w-4 h-4" />}
                title="文字颜色"
              />
            </Dropdown>
            <Dropdown
              menu={{
                items: [
                  {
                    key: "yellow",
                    label: <div className="w-6 h-6 bg-yellow-300 rounded" />,
                    onClick: () => handleSetHighlight("#fef08a"),
                  },
                  {
                    key: "green",
                    label: <div className="w-6 h-6 bg-green-300 rounded" />,
                    onClick: () => handleSetHighlight("#86efac"),
                  },
                  {
                    key: "blue",
                    label: <div className="w-6 h-6 bg-blue-300 rounded" />,
                    onClick: () => handleSetHighlight("#93c5fd"),
                  },
                  {
                    key: "pink",
                    label: <div className="w-6 h-6 bg-pink-300 rounded" />,
                    onClick: () => handleSetHighlight("#f9a8d4"),
                  },
                  {
                    key: "purple",
                    label: <div className="w-6 h-6 bg-purple-300 rounded" />,
                    onClick: () => handleSetHighlight("#c4b5fd"),
                  },
                  {
                    key: "orange",
                    label: <div className="w-6 h-6 bg-orange-300 rounded" />,
                    onClick: () => handleSetHighlight("#fdba74"),
                  },
                ],
              }}
            >
              <Button
                type={editor.isActive("highlight") ? "primary" : "default"}
                size="small"
                icon={<Highlighter className="w-4 h-4" />}
                title="高亮背景"
              />
            </Dropdown>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Dropdown
              menu={{
                items: [
                  {
                    key: "insert",
                    label: "插入表格",
                    onClick: handleInsertTable,
                  },
                  {
                    key: "delete",
                    label: "删除表格",
                    onClick: handleDeleteTable,
                    disabled: !editor.isActive("table"),
                  },
                  { type: "divider" },
                  {
                    key: "addRowBefore",
                    label: "在上方插入行",
                    onClick: handleAddRowBefore,
                    disabled: !editor.isActive("table"),
                  },
                  {
                    key: "addRowAfter",
                    label: "在下方插入行",
                    onClick: handleAddRowAfter,
                    disabled: !editor.isActive("table"),
                  },
                  {
                    key: "deleteRow",
                    label: "删除行",
                    onClick: handleDeleteRow,
                    disabled: !editor.isActive("table"),
                  },
                  { type: "divider" },
                  {
                    key: "addColumnBefore",
                    label: "在左侧插入列",
                    onClick: handleAddColumnBefore,
                    disabled: !editor.isActive("table"),
                  },
                  {
                    key: "addColumnAfter",
                    label: "在右侧插入列",
                    onClick: handleAddColumnAfter,
                    disabled: !editor.isActive("table"),
                  },
                  {
                    key: "deleteColumn",
                    label: "删除列",
                    onClick: handleDeleteColumn,
                    disabled: !editor.isActive("table"),
                  },
                ],
              }}
            >
              <Button
                type={editor.isActive("table") ? "primary" : "default"}
                size="small"
                icon={<TableIcon className="w-4 h-4" />}
                title="表格"
              />
            </Dropdown>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              size="small"
              icon={<Undo className="w-4 h-4" />}
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="撤销 (Ctrl+Z)"
            />
            <Button
              size="small"
              icon={<Redo className="w-4 h-4" />}
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="重做 (Ctrl+Shift+Z)"
            />
          </div>
        )}

        {/* 编辑器内容区域 */}
        <div ref={editorContainerRef} className="flex-1 overflow-auto relative">
          <EditorContent editor={editor} />

          {/* 正在编辑的浮动标识 - 显示在光标位置 */}
          {editingUsers.length > 0 &&
            editingUsers.map((user) => {
              if (user.isSelf || !user.position) return null;
              return (
                <div
                  key={user.clientId}
                  className="editing-indicator pointer-events-none absolute z-[9999]"
                  style={
                    {
                      top: `${user.position.top}px`,
                      left: `${user.position.left}px`,
                      transform: "translateY(-100%)",
                      "--user-color": user.color,
                    } as React.CSSProperties
                  }
                >
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-lg border border-gray-200 backdrop-blur-sm pointer-events-auto whitespace-nowrap">
                    <div className="relative">
                      <Avatar
                        size="small"
                        src={user.avatar}
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <div
                        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white animate-pulse"
                        style={{ backgroundColor: user.color }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-800">
                      {user.name}
                    </span>
                    <div className="flex gap-0.5">
                      <div
                        className="w-1 h-1 rounded-full animate-bounce"
                        style={{
                          backgroundColor: user.color,
                          animationDelay: "0ms",
                        }}
                      />
                      <div
                        className="w-1 h-1 rounded-full animate-bounce"
                        style={{
                          backgroundColor: user.color,
                          animationDelay: "150ms",
                        }}
                      />
                      <div
                        className="w-1 h-1 rounded-full animate-bounce"
                        style={{
                          backgroundColor: user.color,
                          animationDelay: "300ms",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 保存提示 */}
      {isSaving && (
        <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="mt-2 text-gray-700 text-sm">正在保存中...</div>
          </div>
        </div>
      )}

      {/* 链接插入对话框 */}
      <Modal
        title="插入链接"
        open={linkModalVisible}
        onOk={confirmLink}
        onCancel={() => {
          setLinkModalVisible(false);
          setLinkUrl("");
        }}
        okText="确定"
        cancelText="取消"
      >
        <Input
          placeholder="请输入链接地址 (例如: https://example.com)"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onPressEnter={confirmLink}
          autoFocus
        />
      </Modal>

      {/* 图片插入对话框 */}
      <Modal
        title="插入图片"
        open={imageModalVisible}
        onOk={confirmImage}
        onCancel={() => {
          setImageModalVisible(false);
          setImageUrl("");
        }}
        okText="确定"
        cancelText="取消"
      >
        <Input
          placeholder="请输入图片地址或 Base64 编码"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          onPressEnter={confirmImage}
          autoFocus
        />
      </Modal>
    </div>
  );
};

export default Tiptap;
