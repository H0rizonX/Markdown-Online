type FileItem = {
  title: string;
  author: string;
  type: "doc" | "sheet";
  path: string;
  time: string;
  tag?: string | null;
};

type FileGridProps = {
  files: FileItem[];
  currentPage: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

type articleType = {
  authorId?: number;
  title?: string;
  author?: string;
};

export type { FileItem, FileGridProps, articleType };
