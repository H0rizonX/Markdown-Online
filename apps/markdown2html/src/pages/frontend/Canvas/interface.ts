import type { FileItem } from "../Home/interface";
import type * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness";
import type { WebsocketProvider } from "y-websocket";
import type { Editor } from "@tiptap/core";
// 从 Tiptap 文档中抽取的标题结构
interface HeadingItem {
  id: string;
  text: string;
  level: number;
  pos: number;
}

interface CanvasProps {
  file?: FileItem;
  onClose?: () => void;
  onSelectDoc?: (doc: FileItem) => void;
}
type componentProps = CanvasProps & {
  isExpended: boolean;
  setIsExpended?: (isExpended: boolean) => void;
  text?: string;
  ydoc?: Y.Doc;
  provider?: WebsocketProvider;
  awareness?: Awareness;
  editor?: Editor | null; // 编辑器实例，用于导入导出
  // 当编辑器标题发生变化时回调
  onHeadingsChange?: (headings: HeadingItem[]) => void;
  // 将 Tiptap editor 实例暴露给外部（用于侧边栏跳转）
  // 使用 any 避免在此文件中引入额外依赖
  onEditorReady?: (editor: Editor | null) => void;
};

export type { componentProps, CanvasProps, HeadingItem };
