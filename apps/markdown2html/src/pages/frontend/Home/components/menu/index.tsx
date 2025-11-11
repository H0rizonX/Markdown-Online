import { type FC } from "react";
import type { MenuProps } from "antd";
import { Menu } from "antd";
import { Blinds, Share2, User, Users } from "lucide-react";

type MenuItem = Required<MenuProps>["items"][number];

interface HomeMenuProps {
  currentKey: string;

  onSelect: (key: string) => void;
}

const items: MenuItem[] = [
  {
    key: "mainPage",
    label: "首页",
    icon: <Blinds />,
  },
  {
    key: "sharing",
    label: "共享",
    icon: <Share2 />,
  },
  {
    type: "divider",
  },
  {
    key: "mine",
    label: "我的文档",
    icon: <User />,
  },
  {
    key: "team",
    label: "团队",
    icon: <Users />,
  },
];

const HomeMenu: FC<HomeMenuProps> = ({ currentKey, onSelect }) => {
  const onClick: MenuProps["onClick"] = (e) => {
    onSelect(e.key);
  };

  return (
    <Menu
      onClick={onClick}
      className="w-full h-full border-none"
      selectedKeys={[currentKey]}
      mode="inline"
      items={items}
    />
  );
};

export default HomeMenu;
