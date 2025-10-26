import { type FC } from "react";
import type { MenuProps } from "antd";
import { Menu } from "antd";
import { Blinds, Share2, Star, User, Users } from "lucide-react";

type MenuItem = Required<MenuProps>["items"][number];

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
    key: "liked",
    label: "收藏",
    icon: <Star />,
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
    label: "团队文档",
    icon: <Users />,
  },
];

const HomeMenu: FC = () => {
  const onClick: MenuProps["onClick"] = (e) => {
    console.log("click ", e);
  };

  return (
    <Menu
      onClick={onClick}
      className="w-full h-full border-none"
      defaultSelectedKeys={["mainPage"]}
      defaultOpenKeys={["mainPage"]}
      mode="inline"
      items={items}
    />
  );
};

export default HomeMenu;
