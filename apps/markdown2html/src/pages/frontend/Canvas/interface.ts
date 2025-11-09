import type { FileItem } from "../Home/interface";
import type * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness";
import type { WebsocketProvider } from "y-websocket";

interface CanvasProps {
  file?: FileItem;
  onClose?:()=>void;
}
type componentProps = CanvasProps &{
    isExpended:boolean;
    setIsExpended?: (isExpended: boolean) => void;
    text?:string;
    ydoc?: Y.Doc;
    provider?: WebsocketProvider;
    awareness?: Awareness;
};



export type {componentProps,CanvasProps}