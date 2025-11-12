import React, { useState, useMemo } from "react";
import { Input, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import FileGrid from "../file-grid/index";
import type { FileItem } from "../../interface";

interface DocumentListPanelProps {
  files: FileItem[];
  pageSize?: number;
  onCreate?: () => void;
}

const DocumentListPanel: React.FC<DocumentListPanelProps> = ({
  files,
  pageSize = 16,
  onCreate,
}) => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredFiles = useMemo(() => {
    if (!files) return []; // 处理 files 为 null 的情况
    if (!searchKeyword) return files; // 空搜索返回所有文件

    const keyword = searchKeyword.toLowerCase();
    return files.filter((file) => file.title?.toLowerCase().includes(keyword));
  }, [files, searchKeyword]);

  const paginatedFiles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFiles.slice(start, start + pageSize);
  }, [filteredFiles, currentPage, pageSize]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <Input
          placeholder="搜索文档标题"
          allowClear
          prefix={<SearchOutlined />}
          className="w-full max-w-sm"
          onChange={(e) => {
            setSearchKeyword(e.target.value);
            setCurrentPage(1);
          }}
        />
        <Button className="ml-4" type="primary" onClick={onCreate}>
          + 新建
        </Button>
      </div>

      <div className="flex-1 overflow-auto pb-6">
        <FileGrid
          files={paginatedFiles}
          currentPage={currentPage}
          total={filteredFiles.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default DocumentListPanel;
