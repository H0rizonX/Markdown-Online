import { DownOutlined } from "@ant-design/icons";
import { Empty, Tree, type TreeDataNode, type TreeProps } from "antd";
import type { FC } from "react";
import type { HeadingItem } from "../../interface";

interface SidebarProps {
  headings: HeadingItem[];
  onSelectHeading?: (heading: HeadingItem) => void;
}

// 将线性标题列表构造成层级树结构（根据 heading level）
function buildTreeFromHeadings(headings: HeadingItem[]): TreeDataNode[] {
  if (!headings.length) return [];

  const root: TreeDataNode[] = [];
  const stack: { level: number; node: TreeDataNode }[] = [];

  headings.forEach((h) => {
    const treeNode: TreeDataNode = {
      title: h.text,
      key: h.id,
      // 用于后续 onSelect 时快速找到 heading
      children: [],
    };

    // 找到最近的比当前 level 小的父节点
    while (stack.length && stack[stack.length - 1].level >= h.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(treeNode);
    } else {
      const parent = stack[stack.length - 1].node;
      if (!parent.children) parent.children = [];
      parent.children.push(treeNode);
    }

    stack.push({ level: h.level, node: treeNode });
  });

  return root;
}

const Sidebar: FC<SidebarProps> = ({ headings, onSelectHeading }) => {
  const treeData = buildTreeFromHeadings(headings);

  const onSelect: TreeProps["onSelect"] = (selectedKeys) => {
    if (!onSelectHeading || !selectedKeys.length) return;
    const key = selectedKeys[0];
    const heading = headings.find((h) => h.id === key);
    if (heading) {
      onSelectHeading(heading);
    }
  };

  return (
    <div className="h-full w-full p-4 flex flex-col bg-white">
      <div className="mb-2 text-sm font-medium text-gray-500">文档目录</div>
      <div className="flex-grow overflow-y-auto">
        {treeData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <Empty description="暂无标题，开始在编辑器中使用 H1/H2/H3 吧～" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <Tree
            showLine
            switcherIcon={<DownOutlined />}
            defaultExpandAll
            onSelect={onSelect}
            treeData={treeData}
            className="h-full max-h-full text-sm"
          />
        )}
      </div>
    </div>
  );
};

export default Sidebar;
