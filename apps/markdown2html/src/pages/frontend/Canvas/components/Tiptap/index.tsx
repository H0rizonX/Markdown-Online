import "./index.scss";
import { useEffect, useMemo, useRef, useState, type FC } from "react";
import type { componentProps } from "../../interface.ts";
import { message, Button, Avatar, Badge } from "antd";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { getUser } from "../../../../../utils";
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
  Users
} from "lucide-react";

// 配置：默认连接 ws://<host>:3004，房间 demo（可用 window.VITE_YJS_WS_SERVER 覆盖）
const DEFAULT_SERVER = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:3004`;
const win = window as unknown as { VITE_YJS_WS_SERVER?: string; VITE_YJS_WS_ROOM?: string };
const SERVER = win.VITE_YJS_WS_SERVER || DEFAULT_SERVER;
const ROOM = win.VITE_YJS_WS_ROOM || "default";

// 根据用户ID生成稳定的颜色
const COLORS = [
  '#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8',
  '#94FADB', '#B9F18D', '#C2D5FF', '#FFD5E5', '#FFD93D'
];

function getUserColor(userId: number): string {
  return COLORS[userId % COLORS.length];
}

// 获取或创建用户信息（基于登录用户）
function getCollaborationUser() {
  const loggedInUser = getUser();
  
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
  const TEMP_USER_KEY = 'collab_temp_user';
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
    email: '',
    avatar: '',
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

const Tiptap: FC<componentProps> = (props) => {
  const { isExpended, ydoc: externalYdoc, provider: externalProvider, awareness: externalAwareness } = props;
  const [messageApi, contextHolder] = message.useMessage();
  const [isSaving, setIsSaving] = useState(false);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const userRef = useRef(getCollaborationUser());

  // 使用外部传入的 Yjs 资源，如果没有则创建新的
  const { ydoc, provider, awareness } = useMemo(() => {
    if (externalYdoc && externalProvider && externalAwareness) {
      return { 
        ydoc: externalYdoc, 
        provider: externalProvider, 
        awareness: externalAwareness 
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
      }),
      Collaboration.configure({
        document: ydoc,
      }),
    ],
    content: '',
    editable: true,
    editorProps: {
      attributes: {
        class: 'tiptap ProseMirror',
        'data-placeholder': '开始输入...',
      },
    },
  });

  // 设置用户 awareness 信息
  useEffect(() => {
    if (!awareness) return;

    // 设置当前用户信息到 awareness
    awareness.setLocalStateField('user', {
      name: userRef.current.name,
      color: userRef.current.color,
      userId: userRef.current.userId,
      email: userRef.current.email,
      avatar: userRef.current.avatar,
    });

    // 监听 awareness 变化（在线用户变化）
    const updateOnlineUsers = () => {
      const states = awareness.getStates();
      const users: OnlineUser[] = [];
      
      states.forEach((state, clientId) => {
        if (state.user) {
          users.push({
            clientId: Number(clientId),
            name: state.user.name || '未知用户',
            color: state.user.color || '#958DF1',
            userId: state.user.userId,
            avatar: state.user.avatar,
          });
        }
      });
      
      setOnlineUsers(users);
    };

    awareness.on('change', updateOnlineUsers);
    updateOnlineUsers(); // 初始更新

    return () => {
      try {
        awareness.off('change', updateOnlineUsers);
      } catch {
        // noop
      }
    };
  }, [awareness]);

  // 监听连接状态
  useEffect(() => {
    if (!provider) return;

    const onStatus = (ev: { status: 'connected' | 'disconnected' | 'connecting' }) => {
      setConnected(ev.status === 'connected');
      if (ev.status === 'connected') {
        console.info('[Tiptap] 已连接到协同服务器');
      } else if (ev.status === 'disconnected') {
        console.warn('[Tiptap] 已断开连接');
      }
    };

    provider.on('status', onStatus);
    
    // 检查当前连接状态
    const checkStatus = () => {
      try {
        const isConnected = (provider as unknown as { connected?: boolean }).connected;
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
        provider.off('status', onStatus);
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
      console.log('保存内容:', content);
      
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
        </div>
        
        {/* 在线用户列表 */}
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-gray-500">在线 ({onlineUsers.length})</span>
          <div className="flex items-center gap-1">
            {onlineUsers.map((user) => (
              <Badge
                key={user.clientId}
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
              type={editor.isActive('bold') ? 'primary' : 'default'}
              size="small"
              icon={<Bold className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="加粗 (Ctrl+B)"
            />
            <Button
              type={editor.isActive('italic') ? 'primary' : 'default'}
              size="small"
              icon={<Italic className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="斜体 (Ctrl+I)"
            />
            <Button
              type={editor.isActive('strike') ? 'primary' : 'default'}
              size="small"
              icon={<Strikethrough className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="删除线"
            />
            <Button
              type={editor.isActive('code') ? 'primary' : 'default'}
              size="small"
              icon={<Code className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleCode().run()}
              title="行内代码"
            />
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              type={editor.isActive('heading', { level: 1 }) ? 'primary' : 'default'}
              size="small"
              icon={<Heading1 className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              title="标题 1"
            />
            <Button
              type={editor.isActive('heading', { level: 2 }) ? 'primary' : 'default'}
              size="small"
              icon={<Heading2 className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              title="标题 2"
            />
            <Button
              type={editor.isActive('heading', { level: 3 }) ? 'primary' : 'default'}
              size="small"
              icon={<Heading3 className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              title="标题 3"
            />
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              type={editor.isActive('bulletList') ? 'primary' : 'default'}
              size="small"
              icon={<List className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="无序列表"
            />
            <Button
              type={editor.isActive('orderedList') ? 'primary' : 'default'}
              size="small"
              icon={<ListOrdered className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="有序列表"
            />
            <Button
              type={editor.isActive('blockquote') ? 'primary' : 'default'}
              size="small"
              icon={<Quote className="w-4 h-4" />}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              title="引用"
            />
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
        <div className="flex-1 overflow-auto">
          <EditorContent editor={editor} />
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
    </div>
  );
};

export default Tiptap;
