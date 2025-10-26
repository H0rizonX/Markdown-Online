import {
  HomeFilled,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Input, Tooltip } from "antd";
import { useState, type FC } from "react";
import "./index.scss";
import type { componentProps } from "../../interface";
import { FileStack, FileUp, Plus, RotateCcw } from "lucide-react";

const Menu: FC<componentProps> = (props) => {
  const [isFolded, setIsFolded] = useState(false);
  const [hovering, setHovering] = useState(false);

  const { setIsExpended = () => {}, onClose = () => {} } = props;
  const shouldShowMenu = !isFolded || hovering;

  return (
    <div
      className={`fixed top-0 left-0 h-full z-20
          transform transition-transform duration-500 ease-in-out
          ${shouldShowMenu ? "translate-x-0" : "-translate-x-[300px]"}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="menu w-[300px] h-full bg-gray-50 border-r flex-col justify-center items-center">
        <div className="flex flex-row w-full h-10 items-center justify-between px-3">
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

        <div className="w-full h-10 flex items-center  justify-center">
          <Input
            prefix={<SearchOutlined />}
            className="w-[280px] h-8 !bg-gray-200 outline-none border-none
                       text-base 
                     hover:!bg-gray-300
                     focus:!bg-gray-300"
            placeholder="快速搜索文档标题"
          />
        </div>
        <div className="w-full flex-1 px-3 flex flex-row items-center justify-between">
          <div className="text-gray-700 text-sm">目录</div>
          <div className="flex flex-row items-center gap-2 text-[#666]">
            <Tooltip placement="top" title="新建文件">
              <Plus className="w-5 h-5 hover:text-gray-700  hover:bg-gray-200 transition-all duration-300" />
            </Tooltip>
            <Tooltip placement="top" title="刷新列表">
              <RotateCcw className="w-4 h-4 hover:text-gray-700 hover:bg-gray-200 transition-all duration-300" />
            </Tooltip>
            <Tooltip placement="top" title="多选">
              <FileStack className="w-4 h-4 hover:text-gray-700 hover:bg-gray-200 transition-all duration-300" />
            </Tooltip>
            <Tooltip placement="top" title="导出">
              <FileUp className="w-4 h-4 hover:text-gray-700 hover:bg-gray-200 transition-all duration-300" />
            </Tooltip>
          </div>
        </div>
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
  );
};

export default Menu;
