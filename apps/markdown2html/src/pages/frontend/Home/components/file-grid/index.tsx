import { useState, type FC } from "react";
import { FileText, Sheet, Trash2 } from "lucide-react";
import { Pagination, Tag, message, Popconfirm } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas } from "../../../Canvas";
import type { FileGridProps, FileItem } from "../../interface";
import { getMessageApi } from "../../../../../utils";

const FileGrid: FC<FileGridProps> = ({
  files,
  currentPage,
  total,
  pageSize,
  onPageChange,
}) => {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const closeDoc = () => {
    setSelectedFile(null);
  };

  const getRandomColor = () => {
    const colors = [
      "magenta",
      "red",
      "volcano",
      "orange",
      "gold",
      "lime",
      "green",
      "cyan",
      "blue",
      "geekblue",
      "purple",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const msgBox = getMessageApi();

  // 删除文档处理函数 - 添加完整类型定义
  const handleDelete = async (
    file: FileItem,
    event?: React.MouseEvent<HTMLElement>
  ) => {
    event?.stopPropagation();
    try {
      console.log(file, "选择的file");
      msgBox.success("文档删除成功");
    } catch (error) {
      message.error("文档删除失败");
      console.error("删除文档失败:", error);
    }
  };

  const handleCancel = (event?: React.MouseEvent<HTMLElement>) => {
    event?.stopPropagation();
  };

  const handleTrashClick = (event: React.MouseEvent<SVGSVGElement>) => {
    event.stopPropagation(); // 阻止冒泡
  };

  return (
    <div className="relative h-full">
      <div className="grid grid-cols-4 gap-6 mb-6 flex-1 overflow-hidden">
        {files.length > 0 ? (
          files
            .filter((file) => file != null)
            .map((file, index) => (
              <motion.div
                layoutId={`file-${index}`}
                key={index}
                onClick={() => setSelectedFile(file)}
                className="p-3 border rounded hover:shadow-md hover:border-blue-400 transition cursor-pointer 
                          h-36 flex flex-col relative group"
              >
                <div className="absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Popconfirm
                    title="确定要删除这个文档吗？"
                    description="删除后将无法恢复"
                    onConfirm={(e) => handleDelete(file, e)}
                    onCancel={handleCancel}
                    okText="确定"
                    cancelText="取消"
                    okType="danger"
                  >
                    <Trash2
                      className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                      onClick={handleTrashClick}
                    />
                  </Popconfirm>
                </div>

                <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                  {file.type === "sheet" ? (
                    <Sheet className="text-green-500 w-4 h-4 flex-shrink-0" />
                  ) : (
                    <FileText className="text-blue-500 w-4 h-4 flex-shrink-0" />
                  )}
                  <div className="text-sm font-medium line-clamp-2 flex-1 min-w-0">
                    {file.title}
                  </div>

                  <div className="text-[11px] flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full font-medium ${
                        file.team
                          ? "bg-blue-100 text-blue-700 border border-blue-200"
                          : "bg-gray-100 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {file.team ? "🏢团队" : "👤个人"}
                    </span>
                  </div>
                </div>

                {file.tags && file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2 flex-shrink-0">
                    {file.tags.map((tag) => (
                      <Tag
                        key={tag}
                        color={getRandomColor()}
                        className="text-xs px-1.5 py-0.5"
                      >
                        {tag}
                      </Tag>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-1 flex-1 min-h-0">
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <div className="text-gray-500 text-[11px]">
                      {file.author?.name}
                    </div>
                    {file.team && (
                      <div className="text-[11px] text-gray-500 line-clamp-1">
                        {file.team.name}
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-gray-400 mt-auto flex-shrink-0">
                    {new Date(file.updatedAt!).toLocaleString("zh-CN", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </motion.div>
            ))
        ) : (
          <div
            className="text-center text-gray-500 col-span-4 py-8 flex items-center justify-center"
            style={{ height: "640px" }}
          >
            没有匹配的文档
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-full flex justify-center pb-4">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={total}
          onChange={onPageChange}
          showSizeChanger={false}
        />
      </div>

      <AnimatePresence>
        {selectedFile && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/30 z-40 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              style={{ willChange: "opacity" }}
            />

            <motion.div
              layoutId={`file-${files.indexOf(selectedFile)}`}
              className="fixed inset-0 bg-white z-50 p-6 overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              style={{ willChange: "transform, opacity" }}
            >
              <Canvas file={selectedFile} onClose={closeDoc} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileGrid;
