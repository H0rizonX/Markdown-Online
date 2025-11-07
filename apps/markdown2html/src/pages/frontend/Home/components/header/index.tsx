import { UserOutlined } from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Space,
  Typography,
  type MenuProps,
} from "antd";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { removeToken, removeUser, getUser } from "../../../../../utils";
import { useEffect, useState } from "react";
import type { User } from "../../../../../utils/user";

const HeaderBar: FC = () => {
  const { Link } = Typography;
  const navigator = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // 获取当前用户信息
    const user = getUser();
    setCurrentUser(user);
  }, []);

  const handleLogout = () => {
    // 清除 token 和用户信息
    removeToken();
    removeUser();
    // 跳转到登录页
    navigator("/login");
  };

  const items: MenuProps["items"] = [
    {
      label: <Link>我的消息</Link>,
      key: "0",
    },
    {
      label: <Link>个人中心</Link>,
      key: "1",
    },
    {
      type: "divider",
    },
    {
      label: (
        <Link onClick={handleLogout} style={{ color: "#ff4d4f" }}>
          登出
        </Link>
      ),
      key: "2",
    },
  ];

  return (
    <header className="w-full px-6 py-3 flex justify-between items-center shadow-sm sticky top-0 z-10 bg-white">
      <div className="text-xl font-semibold">MarkdownOnline · 文档中心</div>
      <div className="flex gap-4 items-center">
        <Button type="link">设置</Button>
        <Space size={24}>
          {currentUser && (
            <span className="text-sm text-gray-600">{currentUser.name}</span>
          )}
          <Dropdown menu={{ items }}>
            <Badge dot>
              <Avatar
                src={currentUser?.avatar}
                icon={!currentUser?.avatar && <UserOutlined />}
                style={{ cursor: "pointer" }}
              />
            </Badge>
          </Dropdown>
        </Space>
      </div>
    </header>
  );
};

export default HeaderBar;
