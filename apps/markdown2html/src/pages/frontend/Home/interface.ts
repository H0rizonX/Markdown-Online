type FileItem = {
  title: string;
  author:string,
  type: "doc" | "sheet";
  path: string;
  time: string;
  tag?: string | null;
};

interface FileGridProps {
  files: FileItem[];
  currentPage: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export type {FileItem,FileGridProps}