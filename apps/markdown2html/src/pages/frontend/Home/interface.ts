import type { ArticleType, UserType } from "../../../types/common";
import type { TeamType } from "./components/createTeam/service";

type FileItem = ArticleType & {
  author: UserType;
  type: "doc" | "sheet";
  path: string;
  time: string;
  tags?: string[];
  team?: TeamType;
};

type FileGridProps = {
  files: FileItem[];
  currentPage: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onDeleteSuccess?: () => void;
};

export type { FileItem, FileGridProps };
