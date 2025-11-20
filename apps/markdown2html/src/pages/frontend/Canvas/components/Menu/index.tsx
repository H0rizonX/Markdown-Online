import {
  HomeFilled,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Input, Tooltip, Tag } from "antd";
import { useEffect, useState, type FC } from "react";
import "./index.scss";
import type { componentProps } from "../../interface";
import { Plus, RotateCcw } from "lucide-react";
import useUserStore from "../../../../../stores/user";
import { getDocuments } from "../../../Home/service";
import type { FileItem } from "../../../Home/interface";

const Menu: FC<componentProps> = (props) => {
  const [isFolded, setIsFolded] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [docs, setDocs] = useState<FileItem[]>([]); // 文章列表

  const { setIsExpended = () => {}, onClose = () => {}, onSelectDoc } = props;
  const shouldShowMenu = !isFolded || hovering;

  const { userInfo } = useUserStore();

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const result = await getDocuments({
          authorId: userInfo?.id ? Number(userInfo.id) : 0,
          type: "all",
        });
        setDocs(result.data as FileItem[]);
      } catch (err) {
        console.error("获取文档失败:", err);
      }
    };
    fetchDocs();
  }, [userInfo?.id]);

  return (
    <div
      className={`fixed top-0 left-0 h-full z-20
        transform transition-transform duration-500 ease-in-out
        ${shouldShowMenu ? "translate-x-0" : "-translate-x-[300px]"}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="menu w-[300px] h-full bg-gray-50 border-r flex flex-col">
        {/* 顶部标题 */}
        <div className="flex flex-row w-full h-10 items-center justify-between px-3 border-b">
          <Button
            className="btn"
            onClick={() => {
              onClose();
            }}
          >
            <HomeFilled />
          </Button>
          我的文档
        </div>

        {/* 搜索框 */}
        <div className="w-full h-10 flex items-center justify-center px-3 my-2">
          <Input
            prefix={<SearchOutlined />}
            className="w-full h-8 !bg-gray-200 outline-none border-none text-base hover:!bg-gray-300 focus:!bg-gray-300"
            placeholder="快速搜索文档标题"
          />
        </div>

        {/* 小型文章列表 */}
        <div className="flex-1 overflow-y-auto px-3 space-y-2">
          {docs.length > 0 ? (
            docs.map((doc, index) => {
              const updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : null;
              return (
                <div
                  key={index}
                  className="relative flex flex-col p-3 rounded border border-gray-200 hover:shadow-md hover:border-blue-300 cursor-pointer transition"
                  title={doc.title}
                  onClick={() => {
                    console.log("点击文档:", doc.title);
                    onSelectDoc?.(doc);
                  }}
                >
                  {/* 右上角文档类型标签 */}
                  <div className="absolute top-2 right-2">
                    <Tag color={doc.visibility === "team" ? "blue" : "green"}>
                      {doc.visibility === "team" ? "团队文档" : "个人文档"}
                    </Tag>
                  </div>

                  {/* 文档标题 */}
                  <div className="text-sm font-semibold truncate">
                    {doc.title}
                  </div>

                  {/* 作者和更新时间 */}
                  <div className="text-xs text-gray-500 mt-1 flex justify-between items-center">
                    <span>{doc.author?.name || "未知作者"}</span>
                    <span>
                      {updatedAt ? updatedAt.toLocaleDateString() : "未知时间"}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-gray-400 text-sm text-center mt-4">
              暂无文档
            </div>
          )}
        </div>

        {/* 底部操作按钮 */}
        <div className="flex justify-between items-center px-3 py-2 border-t">
          <div className="flex gap-2">
            <Tooltip title="新建文件">
              <Plus className="w-5 h-5 hover:text-gray-700 hover:bg-gray-200 transition-all duration-300 p-1 rounded" />
            </Tooltip>
            <Tooltip title="刷新列表">
              <RotateCcw className="w-4 h-4 hover:text-gray-700 hover:bg-gray-200 transition-all duration-300 p-1 rounded" />
            </Tooltip>
          </div>
          <div className="absolute top-2 right-[-40px]">
            <Button
              className="btn open"
              onClick={() => {
                setIsFolded(!isFolded);
                setIsExpended?.(!isFolded);
              }}
            >
              {!isFolded ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;
