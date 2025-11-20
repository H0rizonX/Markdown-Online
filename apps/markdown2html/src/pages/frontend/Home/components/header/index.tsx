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
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import type { dataType } from "../../../../../types/common";
import useUserStore from "../../../../../stores/user";
import { useTokenStore } from "../../../../../stores/token";
import { getUserInfo } from "../../../LoginPage/service";

const HeaderBar: FC = () => {
  const { Link } = Typography;
  const navigator = useNavigate();

  const { userInfo } = useUserStore();

  const { logout, login } = useUserStore();
  const { token, clearToken } = useTokenStore();
  const location = useLocation();
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        navigator("/login", { state: { from: location } });
        return;
      }
      try {
        const res = await getUserInfo(token);
        const result: dataType = res.data as dataType;
        if (result && result.user) {
          login(result.user);
        } else {
          navigator("/login", { state: { from: location } });
        }
      } catch (err) {
        console.error("获取用户信息失败:", err);
        navigator("/login", { state: { from: location } });
      }
    };

    fetchUser();
  }, [token]);

  const handleLogout = () => {
    // 清除 token 和用户信息
    clearToken();
    logout();
    // 跳转到登录页
    navigator("/login");
  };

  const items: MenuProps["items"] = [
    {
      label: <Link>我的消息</Link>,
      key: "0",
    },
    {
      label: (
        <Link
          onClick={() => {
            navigator("/ProfileCenter");
          }}
        >
          个人中心
        </Link>
      ),
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
          {userInfo && (
            <span className="text-sm text-gray-600">{userInfo.name}</span>
          )}
          <Dropdown menu={{ items }}>
            <Badge dot>
              <Avatar
                src={userInfo?.avatar}
                icon={!userInfo?.avatar && <UserOutlined />}
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
