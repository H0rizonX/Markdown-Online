import React from "react";
import { Menu } from "antd";
import {
  UserOutlined,
  SettingOutlined,
  NotificationOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "个人中心",
      path: "/profile",
    },
    {
      key: "notifications",
      icon: <NotificationOutlined />,
      label: "通知中心",
      path: "/notifications",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "设置",
      path: "/settings",
    },
  ];

  const selectedKey =
    items.find((item) => item.path === location.pathname)?.key || "profile";

  return (
    <div className="w-52  bg-transparent border-r border-gray-200">
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={(e) => {
          const item = items.find((i) => i.key === e.key);
          if (item) navigate(item.path);
        }}
        items={items.map((item) => ({
          key: item.key,
          icon: item.icon,
          label: item.label,
          style: {
            borderRadius: 6,
            margin: "4px 0",
          },
        }))}
        style={{
          background: "transparent",
        }}
      />
      <style>
        {`
          /* 设置选中高亮为灰色 */
          .ant-menu-item-selected {
            background-color: #e6e6e6 !important;
            color: #000 !important;
          }

          /* hover 高亮 */
          .ant-menu-item:hover {
            background-color: #f5f5f5 !important;
          }
        `}
      </style>
    </div>
  );
};

export default Sidebar;
