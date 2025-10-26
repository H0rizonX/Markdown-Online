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

const HeaderBar: FC = () => {
  const { Link } = Typography;
  const navigator = useNavigate();
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
      label: (
        <Link
          onClick={() => {
            navigator("/login");
          }}
        >
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
          <Dropdown menu={{ items }}>
            <Badge dot>
              <Avatar icon={<UserOutlined />} />
            </Badge>
          </Dropdown>
        </Space>
      </div>
    </header>
  );
};

export default HeaderBar;
