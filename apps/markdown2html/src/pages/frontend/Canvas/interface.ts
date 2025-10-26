import type { FileItem } from "../Home/interface";

interface CanvasProps {
  file?: FileItem;
  onClose?:()=>void;
}
type componentProps = CanvasProps &{
    isExpended:boolean;
    setIsExpended?: (isExpended: boolean) => void;
    text?:string;
  
};



export type {componentProps,CanvasProps}