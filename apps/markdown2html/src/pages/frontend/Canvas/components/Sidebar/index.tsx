import { DownOutlined } from "@ant-design/icons";
import { Tree, type TreeDataNode, type TreeProps } from "antd";
import type { FC } from "react";

const Sidebar: FC = () => {
  const treeData: TreeDataNode[] = [
    {
      title: "文档中心",
      key: "docs",
      children: [
        {
          title: "产品文档",
          key: "docs-product",
          children: [
            { title: "用户指南", key: "docs-product-user" },
            { title: "开发手册", key: "docs-product-dev" },
            { title: "API 参考", key: "docs-product-api" },
          ],
        },
        {
          title: "运维手册",
          key: "docs-ops",
          children: [
            { title: "部署指南", key: "docs-ops-deploy" },
            { title: "监控与告警", key: "docs-ops-monitor" },
          ],
        },
      ],
    },
    {
      title: "项目配置",
      key: "project",
      children: [
        { title: "项目设置", key: "project-setting" },
        { title: "团队管理", key: "project-team" },
        { title: "权限控制", key: "project-auth" },
      ],
    },
    {
      title: "归档文件",
      key: "archive",
      children: [
        { title: "历史版本", key: "archive-history" },
        { title: "废弃文档", key: "archive-deprecated" },
      ],
    },
  ];

  const onSelect: TreeProps["onSelect"] = (selectedKeys, info) => {
    console.log("selected", selectedKeys, info);
  };

  return (
    <div className="h-full w-full p-4 flex flex-col bg-white">
      <div className="flex-grow overflow-y-auto">
        <Tree
          showLine
          switcherIcon={<DownOutlined />}
          defaultExpandedKeys={["docs", "project"]}
          onSelect={onSelect}
          treeData={treeData}
          className="h-full max-h-full"
          defaultExpandAll
        />
      </div>
    </div>
  );
};

export default Sidebar;
