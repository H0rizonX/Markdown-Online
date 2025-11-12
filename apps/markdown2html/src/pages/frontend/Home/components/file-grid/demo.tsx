import { useState, type FC } from "react";
import { FileText, Sheet } from "lucide-react";
import { Pagination } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas } from "../../../Canvas";
import type { FileGridProps, FileItem } from "../../interface";

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

  return (
    <div className="relative h-full">
      <div className="grid grid-cols-4 gap-6 mb-6 flex-1 overflow-hidden">
        {files.length > 0 ? (
          files.map((file, index) => (
            <motion.div
              layoutId={`file-${index}`}
              key={index}
              onClick={() => setSelectedFile(file)}
              className="p-4 border rounded hover:shadow-md hover:border-blue-400 transition cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                {file.type === "doc" ? (
                  <FileText className="text-blue-500 w-5 h-5" />
                ) : (
                  <Sheet className="text-green-500 w-5 h-5" />
                )}
                <div className="text-sm font-medium line-clamp-1">
                  {file.title}
                </div>
              </div>
              {file.tag && (
                <div className="text-xs inline-block bg-blue-100 text-blue-600 px-2 py-0.5 rounded mb-2">
                  {file.tag}
                </div>
              )}
              <div className="flex flex-row justify-start gap-5">
                <div className="text-gray-500 text-[12px]">{file.author}</div>
                <div className="text-xs text-gray-500 line-clamp-1 mb-1">
                  {file.path}
                </div>
              </div>
              <div className="text-xs text-gray-400">{file.time}</div>
            </motion.div>
          ))
        ) : (
          <div className="text-center text-gray-500 col-span-4">
            没有匹配的文档
          </div>
        )}
      </div>

      <div className="flex justify-center">
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
